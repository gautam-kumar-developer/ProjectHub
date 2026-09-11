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
  Shield,
  UserMinus,
  Building2,
  UserPlus,
  Mail,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";
import { addMember, removeMember, updateMemberRole, createDepartment, createWorkspaceUser } from "@/lib/actions";
import { ROLE_CONFIG, ROLES, canAttempt, getAssignableRoles, outranks, type Role } from "@/lib/rbac";

interface TeamClientProps {
  members: any[];
  departments: any[];
  workspaceId: string;
  workspaceName: string;
  currentUserRole: string;
}

export function TeamClient({ members, departments, workspaceId, workspaceName, currentUserRole }: TeamClientProps) {
  const [search, setSearch] = React.useState("");
  
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("DEVELOPER");
  const [inviting, setInviting] = React.useState(false);
  
  const [showDept, setShowDept] = React.useState(false);
  const [deptName, setDeptName] = React.useState("");
  const [deptDesc, setDeptDesc] = React.useState("");
  const [creatingDept, setCreatingDept] = React.useState(false);

  const [showUser, setShowUser] = React.useState(false);
  const [userName, setUserName] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [userRole, setUserRole] = React.useState("DEVELOPER");
  const [userDept, setUserDept] = React.useState("");
  const [creatingUser, setCreatingUser] = React.useState(false);

  const [error, setError] = React.useState("");

  const filtered = members.filter((m) =>
    m.user.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const isManager = canAttempt(currentUserRole, "MANAGE_MEMBERS");
  const canCreateUser = canAttempt(currentUserRole, "CREATE_USER");
  const canCreateDepartment = canAttempt(currentUserRole, "CREATE_DEPARTMENT");
  const assignableRoles = getAssignableRoles(currentUserRole);

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

  async function handleCreateDepartment() {
    if (!deptName.trim()) return;
    setCreatingDept(true);
    setError("");
    try {
      await createDepartment(workspaceId, { name: deptName, description: deptDesc });
      setShowDept(false);
      setDeptName("");
      setDeptDesc("");
    } catch (err: any) {
      setError(err.message || "Failed to create department");
    }
    setCreatingDept(false);
  }

  async function handleCreateUser() {
    if (!userName.trim() || !userEmail.trim()) return;
    setCreatingUser(true);
    setError("");
    try {
      await createWorkspaceUser(workspaceId, {
        name: userName,
        email: userEmail,
        role: userRole,
        departmentId: userDept || undefined,
      });
      setShowUser(false);
      setUserName("");
      setUserEmail("");
      setUserDept("");
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    }
    setCreatingUser(false);
  }

  async function handleRemove(memberId: string) {
    if (confirm("Remove this member from the workspace?")) {
      try {
        await removeMember(memberId);
      } catch (err: any) {
        alert(err.message || "Failed to remove member");
      }
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    try {
      await updateMemberRole(memberId, role);
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
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
        <div className="flex items-center gap-2">
          {canCreateDepartment && (
            <Button variant="outline" onClick={() => setShowDept(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              New Department
            </Button>
          )}
          {canCreateUser && (
            <Button variant="outline" onClick={() => setShowUser(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              New User
            </Button>
          )}
          {isManager && (
            <Button onClick={() => setShowInvite(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
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
          const memberRoleConfig = ROLE_CONFIG[member.role as Role];
          const canManageThisMember = isManager && outranks(currentUserRole, member.role);

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
                  {canManageThisMember && (
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {assignableRoles.map((r) => {
                          const rc = ROLE_CONFIG[r];
                          return (
                            <DropdownMenuItem
                              key={r}
                              onClick={() => handleRoleChange(member.id, r)}
                            >
                              <Shield className="h-4 w-4" /> Make {rc.label}
                            </DropdownMenuItem>
                          );
                        })}
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

                {/* Role and Dept Badge */}
                <div className="flex gap-2">
                  <Badge className={memberRoleConfig?.color || ""} variant="outline">
                    {memberRoleConfig?.label || member.role}
                  </Badge>
                  {member.department && (
                    <Badge variant="secondary">
                      {member.department.name}
                    </Badge>
                  )}
                </div>

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
                {assignableRoles.map((r) => (
                  <SelectOption key={r} value={r}>
                    {ROLE_CONFIG[r].label}
                  </SelectOption>
                ))}
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
      {/* Create User Dialog */}
      <Dialog open={showUser} onOpenChange={setShowUser}>
        <DialogContent onClose={() => setShowUser(false)}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="John Doe"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                placeholder="john@example.com"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={userRole} onValueChange={setUserRole}>
                  {assignableRoles.map((r) => (
                    <SelectOption key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </SelectOption>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={userDept} onValueChange={setUserDept}>
                  <SelectOption value="">None</SelectOption>
                  {departments.map((d: any) => (
                    <SelectOption key={d.id} value={d.id}>
                      {d.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              User will be created with the default password: <code className="bg-muted px-1 py-0.5 rounded">password123</code>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUser(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creatingUser || !userName.trim() || !userEmail.trim()}>
              {creatingUser ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Department Dialog */}
      <Dialog open={showDept} onOpenChange={setShowDept}>
        <DialogContent onClose={() => setShowDept(false)}>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department Name</label>
              <Input
                placeholder="Engineering, Marketing, etc."
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                placeholder="Brief description of this department..."
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDept(false)}>Cancel</Button>
            <Button onClick={handleCreateDepartment} disabled={creatingDept || !deptName.trim()}>
              {creatingDept ? "Creating..." : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
