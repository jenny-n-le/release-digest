import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ExternalLink, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";


interface GtmResource {
  id: number;
  emoji: string;
  title: string;
  url: string;
  sortOrder: number;
}

const SHOWCASE_URL = "https://app.supademo.com/showcase/cmklw4een0001wi0ijyb3jtkg?utm_source=link";

export default function GTM() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ emoji: "🔗", title: "", url: "" });

  const { data: resources = [], isLoading } = useQuery<GtmResource[]>({
    queryKey: ["gtm-resources"],
    queryFn: async () => {
      const res = await fetch("/api/gtm/resources");
      if (!res.ok) throw new Error("Failed to fetch resources");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { emoji: string; title: string; url: string }) => {
      const res = await fetch("/api/gtm/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create resource");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gtm-resources"] });
      resetForm();
      toast({ title: "Resource added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { emoji: string; title: string; url: string } }) => {
      const res = await fetch(`/api/gtm/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update resource");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gtm-resources"] });
      resetForm();
      toast({ title: "Resource updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/gtm/resources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete resource");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gtm-resources"] });
      toast({ title: "Resource removed" });
    },
  });

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ emoji: "🔗", title: "", url: "" });
  };

  const startEdit = (resource: GtmResource) => {
    setEditingId(resource.id);
    setIsAdding(false);
    setForm({ emoji: resource.emoji, title: resource.title, url: resource.url });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast({ title: "Please fill in title and URL", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="pb-20">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-gtm-title">
            Go-To-Market
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resources and tools for go-to-market activities
          </p>
        </div>

        <a
          href={SHOWCASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
          data-testid="link-announcement-banner"
        >
          <div className="bg-white rounded-xl border border-border overflow-hidden flex items-center gap-6 p-0 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex-1 pl-6 py-4">
              <h2 className="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                2026 Product Release Showcase
              </h2>
              <p className="text-sm text-muted-foreground mt-1">See interactive demos of key releases.</p>
            </div>
            <div className="pr-6">
              <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </a>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold text-foreground">Resources</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setIsAdding(true); setEditingId(null); setForm({ emoji: "🔗", title: "", url: "" }); }}
                data-testid="button-add-resource"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Resource
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map((resource) =>
                  editingId === resource.id ? (
                    <div
                      key={resource.id}
                      className="bg-muted/30 rounded-xl border-2 border-primary/20 p-4 space-y-3"
                      data-testid={`form-edit-resource-${resource.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          value={form.emoji}
                          onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                          className="w-14 text-center text-lg"
                          maxLength={2}
                          data-testid="input-resource-emoji"
                        />
                        <Input
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          placeholder="Title"
                          className="flex-1"
                          data-testid="input-resource-title"
                        />
                      </div>
                      <Input
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        placeholder="https://..."
                        data-testid="input-resource-url"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={resetForm} disabled={isSaving}>
                          <X className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} data-testid="button-save-resource">
                          {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:shadow-sm hover:border-primary/30 transition-all"
                      data-testid={`link-resource-${resource.id}`}
                    >
                      <span className="text-2xl" role="img">{resource.emoji}</span>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors flex-1">
                        {resource.title}
                      </span>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(resource); }}
                          className="h-7 w-7 rounded-md bg-muted hover:bg-muted-foreground/10 flex items-center justify-center"
                          title="Edit"
                          data-testid={`button-edit-resource-${resource.id}`}
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteMutation.mutate(resource.id); }}
                          className="h-7 w-7 rounded-md bg-muted hover:bg-destructive/10 flex items-center justify-center"
                          title="Delete"
                          data-testid={`button-delete-resource-${resource.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </a>
                  )
                )}

                {isAdding && (
                  <div
                    className="bg-muted/30 rounded-xl border-2 border-dashed border-primary/30 p-4 space-y-3"
                    data-testid="form-new-resource"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        value={form.emoji}
                        onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                        className="w-14 text-center text-lg"
                        maxLength={2}
                        data-testid="input-new-resource-emoji"
                      />
                      <Input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Resource title"
                        className="flex-1"
                        autoFocus
                        data-testid="input-new-resource-title"
                      />
                    </div>
                    <Input
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://..."
                      data-testid="input-new-resource-url"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={resetForm} disabled={isSaving}>
                        <X className="h-3.5 w-3.5 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSaving} data-testid="button-save-new-resource">
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                {!isAdding && resources.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
                    No resources yet. Click "Add Resource" to get started.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
