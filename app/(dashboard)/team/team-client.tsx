"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectOption } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Users,
  MoreHorizontal,
  Mail,
  Shield,
  UserMinus,
  CheckCircle2,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { addMember, removeMember, updateMemberRole } from "@/lib/actions";

interface TeamClientProps {
  members: any[];
  workspaceId: string;
  workspaceName: string;
  currentUserRole: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  MEMBER: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  VIEWER: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export function TeamClient({ members, workspaceId, workspaceName, currentUserRole }: TeamClientProps) {
  const [search, setSearch] = React.useState("");
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("MEMBER");
  const [inviting, setInviting] = React.useState(false);
  const [error, setError] = React.useState("");

  const filtered = members.filter((m) =>
    m.user.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError("");
    try {
      await addMember(workspaceId, { email: inviteEmail, role: inviteRole });
      setShowInvite(false);
      setInviteEmail("");
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    }
    setInviting(false);
  }

  async function handleRemove(memberId: string) {
    if (confirm("Remove this member from the workspace?")) {
      await removeMember(memberId);
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    await updateMemberRole(memberId, role);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} in {workspaceName}
          </p>
        </div>
        {currentUserRole === "ADMIN" && (
          <Button onClick={() => setShowInvite(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search team members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => {
          const activeTasks = member.user.assignedTasks?.filter((t: any) => t.status !== "DONE") || [];
          const completedTasks = member.user.assignedTasks?.filter((t: any) => t.status === "DONE") || [];
          const totalTasks = member.user.assignedTasks?.length || 0;
          const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

          return (
            <Card key={member.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.user.image}
                      fallback={getInitials(member.user.name)}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold">{member.user.name}</h3>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  {currentUserRole === "ADMIN" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, "ADMIN")}>
                          <Shield className="h-4 w-4" /> Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, "MEMBER")}>
                          <Users className="h-4 w-4" /> Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, "VIEWER")}>
                          <CheckCircle2 className="h-4 w-4" /> Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemove(member.id)}
                          className="text-destructive"
                        >
                          <UserMinus className="h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Role Badge */}
                <Badge className={ROLE_COLORS[member.role] || ""} variant="outline">
                  {member.role}
                </Badge>

                {/* Stats */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Tasks</span>
                    <span className="font-medium">{activeTasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-emerald-500">{completedTasks.length}</span>
                  </div>
                  {totalTasks > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Completion Rate</span>
                        <span>{completionRate}%</span>
                      </div>
                      <Progress value={completionRate} className="h-1.5" />
                    </div>
                  )}
                </div>

                {/* Joined */}
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  Joined {formatDate(member.joinedAt)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent onClose={() => setShowInvite(false)}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The user must already have a ProjectHub account
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectOption value="ADMIN">Admin</SelectOption>
                <SelectOption value="MEMBER">Member</SelectOption>
                <SelectOption value="VIEWER">Viewer</SelectOption>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
