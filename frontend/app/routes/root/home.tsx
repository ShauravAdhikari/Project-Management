import React from "react";
import type { Route } from "../../+types/root";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Yutani Foundation" },
    { name: "description", content: "Welcome to Yutani Foundation!" },
  ];
}

const Homepage = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Project Management Software
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Yutani Foundation
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Coordinate projects, tasks, and team work from one shared
            workspace.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link to="/sign-in">
            <Button className="bg-blue-500 text-white">Login</Button>
          </Link>
          <Link to="/sign-up">
            <Button variant="outline" className="bg-blue-500 text-white">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
