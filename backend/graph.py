import os
from neo4j import GraphDatabase
import dotenv
import pandas as pd
from pyvis.network import Network
import matplotlib.pyplot as plt
import networkx as nx

dotenv.load_dotenv()
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USERNAME")


URI = os.getenv("NEO4J_URI")
USERNAME = os.getenv("NEO4J_USERNAME")
PASSWORD = os.getenv("NEO4J_PASSWORD")
DATABASE = os.getenv("NEO4J_DATABASE")


class MedicineGraphImporter:
    def __init__(self, uri, user, password, database):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.database = database

    def close(self):
        self.driver.close()

    def clear_database(self):

        with self.driver.session(database=self.database) as session:
            session.run("MATCH (n) DETACH DELETE n")
            print("Database cleared")

    def import_medicines(self, excel_file, sheet_name=0):
        """

        Expected Excel columns:
        - Medicine: Name of the medicine
        - Treats: Condition/symptom it treats
        """
        FILE_NAME = "MEDICINES.csv"
        script_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(script_dir, FILE_NAME)

        print(f"File Path: {file_path}")

        df = pd.read_csv(file_path)

        print(f"Found {len(df)} medicines in Excel file")
        print(f"Columns: {df.columns.tolist()}\n")

        with self.driver.session(database=self.database) as session:
            for idx, row in df.iterrows():
                medicine_name = row["Medicine"]
                condition = row["Treats"]

                if pd.isna(medicine_name) or pd.isna(condition):
                    continue

                #  Medicine node
                session.run(
                    """
                    MERGE (m:Medicine {name: $name})
                    RETURN m
                """,
                    name=medicine_name,
                )

                #  Condition node
                session.run(
                    """
                    MERGE (c:Condition {name: $name})
                    RETURN c
                """,
                    name=condition,
                )

                # TREATS relationship
                session.run(
                    """
                    MATCH (m:Medicine {name: $medicine})
                    MATCH (c:Condition {name: $condition})
                    MERGE (m)-[r:TREATS]->(c)
                    RETURN r
                """,
                    medicine=medicine_name,
                    condition=condition,
                )

                print(f"{medicine_name} TREATS {condition}")

        print(f"\nSuccessfully imported {len(df)} medicine-condition relationships!")

    def get_statistics(self):
        """Display graph statistics"""
        with self.driver.session(database=self.database) as session:

            medicine_count = session.run(
                "MATCH (m:Medicine) RETURN count(m) as count"
            ).single()["count"]

            condition_count = session.run(
                "MATCH (c:Condition) RETURN count(c) as count"
            ).single()["count"]

            rel_count = session.run(
                "MATCH ()-[r:TREATS]->() RETURN count(r) as count"
            ).single()["count"]

            print("\n" + "=" * 50)
            print("GRAPH STATISTICS")
            print("=" * 50)
            print(f"Total Medicines:   {medicine_count}")
            print(f"Total Conditions:  {condition_count}")
            print(f"Total Treatments:  {rel_count}")
            print("=" * 50)

    def get_recommendations(self, condition_name):
        """
        Finds all medicines that treat the given condition.
        """

        query = """
    MATCH (c:Condition)<-[:TREATS]-(m:Medicine)
    WHERE c.name STARTS WITH $condition_name 
    RETURN m.name AS RecommendedMedicine
    """

        with self.driver.session(database=self.database) as session:
            result = session.run(query, condition_name=condition_name).data()

            if result:
                medicines = [record["RecommendedMedicine"] for record in result]
                print(f"\n--- Recommended Medicines for '{condition_name}' ---")
                for medicine in medicines:
                    print(f"- {medicine}")
                    return medicines
            else:
                print(f"\nNo medicines found for the condition: '{condition_name}'.")
                return []

    def visualize_graph(self):
        print("\n--- Generating Interactive Graph Visualization... ---")

        query = """
    MATCH (n)-[r]->(m) 
    RETURN 
        id(n) AS source_id, n.name AS source_name, labels(n)[0] AS source_label, 
        id(m) AS target_id, m.name AS target_name, labels(m)[0] AS target_label, 
        type(r) AS relType
    LIMIT 200 
    """

        net = Network(
            height="1000px",
            width="100%",
            directed=True,
            notebook=False,
            bgcolor="#222222",
            font_color="white",
            filter_menu=True,
            cdn_resources="remote",
        )

        color_map = {"Medicine": "#1B9E77", "Condition": "#D95F02"}
        node_size_map = {"Medicine": 20, "Condition": 30}

        node_ids = set()

        with self.driver.session(database=self.database) as session:
            results = session.run(query).data()

        if not results:
            print("No data found to visualize.")
            return

        for record in results:

            source_id = record["source_id"]
            source_name = record["source_name"]
            source_label = record["source_label"]

            if source_id not in node_ids:
                net.add_node(
                    source_id,
                    label=source_name,
                    title=f"{source_label}: {source_name}",
                    group=source_label,
                    color=color_map.get(source_label, "#7570B3"),
                    size=node_size_map.get(source_label, 20),
                )
                node_ids.add(source_id)

            target_id = record["target_id"]
            target_name = record["target_name"]
            target_label = record["target_label"]

            if target_id not in node_ids:
                net.add_node(
                    target_id,
                    label=target_name,
                    title=f"{target_label}: {target_name}",
                    group=target_label,
                    color=color_map.get(target_label, "#D95F02"),
                    size=node_size_map.get(target_label, 30),
                )
                node_ids.add(target_id)

            rel_type = record["relType"]
            net.add_edge(
                source_id,
                target_id,
                label=rel_type.lower(),
                title=rel_type,
                color="#AAAAAA",
                width=1.5,
            )

        # Physics settings for interactive layout i took this from some chines yt lol
        net.set_options("""
        {
            "physics": {
                "forceAtlas2Based": {
                    "gravitationalConstant": -100,
                    "centralGravity": 0.01,
                    "springLength": 200,
                    "springConstant": 0.08
                },
                "minVelocity": 0.75,
                "solver": "forceAtlas2Based"
            },
            "configure": {
                "enabled": true,
                "filter": "physics, layout"
            }
        }
    """)

        try:
            output_file = os.path.join(os.getcwd(), "knowledge_graph_interactive.html")
            net.save_graph(output_file)
            print(
                f"Interactive graph successfully saved to: {os.path.abspath(output_file)}"
            )
        except Exception as e:
            print(f"Error saving graph: {e}")


if __name__ == "__main__":
    importer = MedicineGraphImporter(URI, USERNAME, PASSWORD, DATABASE)

    try:

        # ERROR WITH VISUALIZATION CREATING MANY IMAGES
        importer.import_medicines("MEDICINES.CSV")
        importer.get_statistics()

        print("\n Import completed!")

        print("\n--- Running Recommendation System ---")
        importer.get_recommendations("Hypertension")
        importer.get_recommendations("Insomnia")

        importer.visualize_graph()

    finally:

        importer.close()
