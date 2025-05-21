
import Link from "next/link";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2F2F2F] text-white border-t border-gray-700"> {/* PUCIT Theme: Dark Gray BG, White text */}
      <div className="container mx-auto px-6 py-8 text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <Github className="h-6 w-6" />
          </Link>
          <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <Linkedin className="h-6 w-6" />
          </Link>
          <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            <Twitter className="h-6 w-6" />
          </Link>
          <Link href="mailto:contact@pucitnow.com" className="hover:text-primary transition-colors"> {/* Updated email */}
            <Mail className="h-6 w-6" />
          </Link>
        </div>
        <p className="text-sm">&copy; {new Date().getFullYear()} PUCIT Now. All rights reserved.</p>
        <p className="text-xs mt-1">
          Built with Next.js, Firebase, and Tailwind CSS.
        </p>
        {/* <p className="text-xs mt-2">
          <Link href="/terms" className="hover:underline text-accent">Terms of Service</Link> | 
          <Link href="/privacy" className="hover:underline text-accent"> Privacy Policy</Link>
        </p> */}
      </div>
    </footer>
  );
}
