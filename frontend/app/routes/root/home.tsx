import React from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
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
    <div className="w-full min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center px-6 py-12">
      <div className="flex max-w-2xl flex-col items-center gap-8 rounded-[2rem] border border-border/60 bg-card/90 px-8 py-10 text-center shadow-xl backdrop-blur">
        <BrandLogo
          className="flex-col gap-4"
          imageClassName="size-36 sm:size-44"
          textClassName="sr-only"
          showText={false}
        />

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
