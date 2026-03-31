import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/provider/auth-context";
import type { DashboardOutletContext } from "@/types";
import { ExternalLink, Settings2, Shield, UserRound, Users } from "lucide-react";
import { Link, useOutletContext } from "react-router";

const Settings = () => {
  const { user } = useAuth();
  const { currentWorkspace, workspaces } =
    useOutletContext<DashboardOutletContext>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and check the workspace currently active in the dashboard.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-blue-600" />
              Account
            </CardTitle>
            <CardDescription>
              Your personal profile and security settings live here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="font-medium">{user?.name || "Unknown user"}</div>
              <div className="text-muted-foreground">{user?.email}</div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/user/profile">
                  Open Profile
                  <ExternalLink className="size-4" />
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link to="/user/profile">
                  <Shield className="size-4" />
                  Update Password
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-blue-600" />
              Workspace Context
            </CardTitle>
            <CardDescription>
              The sidebar uses your selected workspace for dashboard links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="font-medium">
                {currentWorkspace?.name || "No workspace selected"}
              </div>
              <div className="text-muted-foreground">
                {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} available
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/workspaces">
                  <Settings2 className="size-4" />
                  Manage Workspaces
                </Link>
              </Button>

              {currentWorkspace && (
                <Button asChild>
                  <Link to={`/workspaces/${currentWorkspace._id}`}>
                    Open Current Workspace
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
