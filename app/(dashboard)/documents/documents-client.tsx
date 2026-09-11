"use client";

import React, { useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectOption } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { canAttempt, hasPermission } from "@/lib/rbac";
import { getInitials, formatDate } from "@/lib/utils";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Trash2,
  Download,
  Search,
  Grid3X3,
  List,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────

interface DocumentItem {
  id: string;
  name: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  projectId: string;
  uploadedById: string;
  uploadedBy: { id: string; name: string; image: string | null };
  project: { id: string; name: string; color: string };
}

interface ProjectItem {
  id: string;
  name: string;
  color: string;
}

interface DocumentsClientProps {
  documents: DocumentItem[];
  projects: ProjectItem[];
  currentUserRole: string;
  currentUserId: string;
  workspaceId: string;
}

// ─── File Icon Helpers ────────────────────────────────────────

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return <FileText className="h-5 w-5" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet className="h-5 w-5" />;
  if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5" />;
  if (mimeType.includes("word") || mimeType.includes("document"))
    return <FileText className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function getFileTypeLabel(mimeType: string): { label: string; className: string } {
  if (mimeType.includes("pdf"))
    return { label: "PDF", className: "bg-red-500/15 text-red-400 border-red-500/25" };
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return { label: "XLS", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  if (mimeType.includes("csv"))
    return { label: "CSV", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  if (mimeType.includes("word") || mimeType.includes("document"))
    return { label: "DOC", className: "bg-blue-500/15 text-blue-400 border-blue-500/25" };
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return { label: "PPT", className: "bg-orange-500/15 text-orange-400 border-orange-500/25" };
  if (mimeType.startsWith("image/"))
    return { label: "IMG", className: "bg-purple-500/15 text-purple-400 border-purple-500/25" };
  if (mimeType.includes("zip") || mimeType.includes("rar"))
    return { label: "ZIP", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
  if (mimeType.includes("text"))
    return { label: "TXT", className: "bg-slate-500/15 text-slate-400 border-slate-500/25" };
  return { label: "FILE", className: "bg-slate-500/15 text-slate-400 border-slate-500/25" };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Toast Component ──────────────────────────────────────────

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-up ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} className="ml-2 cursor-pointer opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export function DocumentsClient({
  documents: initialDocuments,
  projects,
  currentUserRole,
  currentUserId,
  workspaceId,
}: DocumentsClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadProjectId, setUploadProjectId] = useState(projects[0]?.id || "");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const canUpload = canAttempt(currentUserRole, "UPLOAD_DOCUMENT");

  // ─── Toast helpers ──────────────────────────────────────────

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Upload logic ───────────────────────────────────────────

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!uploadProjectId) {
        addToast("error", "Please select a project first");
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      const fileArr = Array.from(files);
      let completed = 0;

      for (const file of fileArr) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("projectId", uploadProjectId);

          const res = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            addToast("error", data.error || `Failed to upload ${file.name}`);
          } else {
            const doc = await res.json();
            setDocuments((prev) => [doc, ...prev]);
            addToast("success", `"${file.name}" uploaded successfully`);
          }
        } catch {
          addToast("error", `Failed to upload ${file.name}`);
        }

        completed++;
        setUploadProgress(Math.round((completed / fileArr.length) * 100));
      }

      setUploading(false);
      setUploadProgress(0);
      router.refresh();
    },
    [uploadProjectId, addToast, router]
  );

  // ─── Drag & Drop handlers ──────────────────────────────────

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      if (!canUpload) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        uploadFiles(files);
      }
    },
    [canUpload, uploadFiles]
  );

  // ─── Delete handler ─────────────────────────────────────────

  const handleDelete = useCallback(
    async (docId: string) => {
      setDeletingId(docId);
      try {
        const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          addToast("error", data.error || "Failed to delete document");
        } else {
          setDocuments((prev) => prev.filter((d) => d.id !== docId));
          addToast("success", "Document deleted");
          router.refresh();
        }
      } catch {
        addToast("error", "Failed to delete document");
      }
      setDeletingId(null);
    },
    [addToast, router]
  );

  // ─── Can delete check ──────────────────────────────────────

  function canDelete(doc: DocumentItem): boolean {
    return hasPermission(currentUserRole, "DELETE_DOCUMENT", {
      userId: currentUserId,
      resourceOwnerId: doc.uploadedById,
    });
  }

  // ─── Filtering ──────────────────────────────────────────────

  const filtered = documents.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesProject = projectFilter === "ALL" || d.projectId === projectFilter;
    return matchesSearch && matchesProject;
  });

  // ─── Stats ──────────────────────────────────────────────────

  const totalSize = documents.reduce((acc, d) => acc + d.sizeBytes, 0);
  const fileTypeCount = documents.reduce((acc, d) => {
    const type = getFileTypeLabel(d.mimeType).label;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div
      className="space-y-6 animate-fade-in"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {documents.length} document{documents.length !== 1 ? "s" : ""} · {formatFileSize(totalSize)} total
          </p>
        </div>
        {canUpload && (
          <div className="flex items-center gap-3">
            <Select value={uploadProjectId} onValueChange={setUploadProjectId}>
              {projects.map((p) => (
                <SelectOption key={p.id} value={p.id}>
                  {p.name}
                </SelectOption>
              ))}
            </Select>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !uploadProjectId}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  uploadFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Drag & Drop Zone */}
      {canUpload && (
        <div
          className={`dropzone-container relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? "dropzone-active border-primary/60 bg-primary/5 scale-[1.01]"
              : "border-border/60 hover:border-primary/30 hover:bg-primary/[0.02]"
          }`}
        >
          <div className="flex flex-col items-center justify-center py-10 px-6">
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
                isDragging
                  ? "gradient-primary scale-110 shadow-lg shadow-primary/25"
                  : "bg-primary/10"
              }`}
            >
              <CloudUpload
                className={`h-8 w-8 transition-all duration-300 ${
                  isDragging ? "text-white animate-bounce" : "text-primary"
                }`}
              />
            </div>

            {uploading ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading... {uploadProgress}%
                </div>
                <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-primary transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {isDragging ? "Drop your files here" : "Drag & drop files to upload"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  PDF, DOC, XLS, PPT, images, and more · Max 10MB per file
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer underline underline-offset-2"
                >
                  or browse files
                </button>
              </>
            )}
          </div>

          {/* Animated border glow when dragging */}
          {isDragging && (
            <div className="absolute inset-0 rounded-2xl pointer-events-none animate-border-glow" />
          )}
        </div>
      )}

      {/* Stats Row */}
      {documents.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(fileTypeCount)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const typeInfo = { label: type, className: "bg-slate-500/15 text-slate-400 border-slate-500/25" };
              // Map back to colors
              if (type === "PDF") typeInfo.className = "bg-red-500/15 text-red-400 border-red-500/25";
              else if (type === "DOC") typeInfo.className = "bg-blue-500/15 text-blue-400 border-blue-500/25";
              else if (type === "XLS" || type === "CSV") typeInfo.className = "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
              else if (type === "PPT") typeInfo.className = "bg-orange-500/15 text-orange-400 border-orange-500/25";
              else if (type === "IMG") typeInfo.className = "bg-purple-500/15 text-purple-400 border-purple-500/25";

              return (
                <Badge key={type} variant="outline" className={typeInfo.className}>
                  {count} {type}
                </Badge>
              );
            })}
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectOption value="ALL">All Projects</SelectOption>
          {projects.map((p) => (
            <SelectOption key={p.id} value={p.id}>
              {p.name}
            </SelectOption>
          ))}
        </Select>
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 transition-colors cursor-pointer ${
              viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 transition-colors cursor-pointer ${
              viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Documents */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No documents found</p>
          <p className="text-xs text-muted-foreground">
            {documents.length === 0
              ? "Upload your first document to get started"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ─── Grid View ─────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc, i) => {
            const typeInfo = getFileTypeLabel(doc.mimeType);
            return (
              <div
                key={doc.id}
                className="group relative rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Type Badge & Actions */}
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className={`text-[10px] font-bold ${typeInfo.className}`}>
                    {typeInfo.label}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={doc.storagePath}
                      download={doc.name}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    {canDelete(doc) && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* File Icon */}
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                  {doc.mimeType.startsWith("image/") ? (
                    <img
                      src={doc.storagePath}
                      alt={doc.name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    getFileIcon(doc.mimeType)
                  )}
                </div>

                {/* Name & Size */}
                <h3 className="text-sm font-medium text-foreground truncate mb-1" title={doc.name}>
                  {doc.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {formatFileSize(doc.sizeBytes)}
                </p>

                {/* Project & Uploader */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="h-2 w-2 rounded-sm shrink-0"
                      style={{ backgroundColor: doc.project.color }}
                    />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {doc.project.name}
                    </span>
                  </div>
                  <Avatar
                    src={doc.uploadedBy.image}
                    fallback={getInitials(doc.uploadedBy.name)}
                    size="sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── List View ─────────────────────────────────────── */
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">
                  Document
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">
                  Type
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">
                  Project
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">
                  Size
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">
                  Uploaded By
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">
                  Date
                </th>
                <th className="p-3 w-[80px]" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const typeInfo = getFileTypeLabel(doc.mimeType);
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground shrink-0">
                          {getFileIcon(doc.mimeType)}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[200px]" title={doc.name}>
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] font-bold ${typeInfo.className}`}>
                        {typeInfo.label}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: doc.project.color }}
                        />
                        <span className="text-sm text-muted-foreground">{doc.project.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatFileSize(doc.sizeBytes)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={doc.uploadedBy.image}
                          fallback={getInitials(doc.uploadedBy.name)}
                          size="sm"
                        />
                        <span className="text-sm">{doc.uploadedBy.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        <a
                          href={doc.storagePath}
                          download={doc.name}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        {canDelete(doc) && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
