"use client"
import React, { useState, FC, MouseEvent } from "react";
import Link from "next/link"; 
import { Button } from '@/components/ui/button';


interface NavigationLinkProps {
    href: string;
    className: string;
    children: React.ReactNode;
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

const NavigationLink: FC<NavigationLinkProps> = ({ href, className, children, onClick }) => (
    <Link href={href} className={className} onClick={onClick}>
        {children}
    </Link>
);


const Navbar: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  interface NavItem {
    name: string;
    path: string;
  }
  
  const navItems: NavItem[] = [
    { name: "Home", path: "/" },
    { name: "Assistant", path: "/assistant" },
    { name: "Patient logs", path: "/patient" },
    { name: "Dashbaord", path: "/dashbaord" }
  ];

  return (
    <nav className="w-full flex justify-center py-5 fixed z-50">
      <div
        className="
          hidden lg:flex items-center gap-5 
          bg-[#1c1c1c]
          opacity-75
          rounded-full
          px-3 py-2
          shadow-lg
          z-20
          min-h-[48px]
        "
      >
        <div className="flex items-center gap-6 h-full opacity-100">
          <div className="w-6 h-6 flex items-center justify-center text-[#94938D] flex-shrink-0 m-2">
            LOGO
          </div>

          {navItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center"
            >
              <NavigationLink
                href={item.path}
                className="text-[#94938D] hover:text-white font-medium whitespace-nowrap flex items-center"
              >
                {item.name}
              </NavigationLink>
            </div>
          ))}
        </div>

        <div className="flex items-center pl-5 border-l border-gray-700 h-full">
          <Button className="rounded-full flex items-center">
            Contact Us
          </Button>
        </div>
      </div>

      <div className="lg:hidden flex items-center justify-between w-full px-4">
        <div className="w-6 h-6 flex items-center justify-center text-[#94938D]">
          <svg viewBox="0 0 100 50">
            <path
              fill="none"
              stroke="red"
              strokeWidth="6"
              transform="scale(1.1)"
              d="M10,25 C20,0 40,0 50,25 C60,50 80,50 90,25
                 C80,0 60,0 50,25
                 C40,50 20,50 10,25 Z"
            />
          </svg>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white focus:outline-none"
          aria-label="Open mobile menu"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#202020] z-40 flex flex-col items-center justify-center lg:hidden"
        >
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-2 text-white focus:outline-none"
            aria-label="Close mobile menu"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <nav className="flex flex-col space-y-8 text-center">
            {navItems.map((item) => (
              <div key={item.name}>
                <NavigationLink
                  href={item.path}
                  className="text-white text-3xl"
                  onClick={handleLinkClick}
                >
                  {item.name}
                </NavigationLink>
              </div>
            ))}
          </nav>

          <div className="mt-10">
            <Button size="lg" onClick={handleLinkClick} className="rounded-xl">
              Contact Us
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
