import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Search, Building2, Package, ClipboardCheck, Plus, Check, Copy, X, Edit3, Save } from "lucide-react";
import { cn } from "@/lib/utils";

const FLASK_URL = "https://course-metadata-bacteria-meet.trycloudflare.com";

// Types
interface CompanyNote {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface CompanyData {
  notes: CompanyNote[];
  tags: string[];
}

interface TemplateInfo {
  type: string;
  questionCount: number;
  tipCount: number;
}

interface TemplateData {
  questions: string[];
  tips: string[];
}

interface ProductItem {
  id: string;
  name: string;
  description: string;
  vendor: string;
  partNumber: string;
  notes: string;
  tags: string[];
  createdAt: string;
}

interface ProductCategory {
  category: string;
  itemCount: number;
}

// API Functions
const fetchCompanies = async (): Promise<{ companies: { name: string; noteCount: number }[] }> => {
  const res = await fetch(`${FLASK_URL}/api/notes/company`);
  return res.json();
};

const fetchCompanyNotes = async (name: string): Promise<CompanyData> => {
  const res = await fetch(`${FLASK_URL}/api/notes/company/${encodeURIComponent(name)}`);
  return res.json();
};

const addCompanyNote = async ({ name, content, tags }: { name: string; content: string; tags: string[] }) => {
  const res = await fetch(`${FLASK_URL}/api/notes/company/${encodeURIComponent(name)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, tags }),
  });
  return res.json();
};

const fetchTemplates = async (): Promise<{ templates: TemplateInfo[] }> => {
  const res = await fetch(`${FLASK_URL}/api/notes/templates`);
  return res.json();
};

const fetchTemplate = async (type: string): Promise<TemplateData> => {
  const res = await fetch(`${FLASK_URL}/api/notes/templates/${encodeURIComponent(type)}`);
  return res.json();
};

const fetchProducts = async (): Promise<{ categories: ProductCategory[] }> => {
  const res = await fetch(`${FLASK_URL}/api/notes/products`);
  return res.json();
};

const fetchProductCategory = async (category: string): Promise<{ category: string; items: ProductItem[] }> => {
  const res = await fetch(`${FLASK_URL}/api/notes/products/${encodeURIComponent(category)}`);
  return res.json();
};

const addProductItem = async ({ category, item }: { category: string; item: Omit<ProductItem, "id" | "createdAt"> }) => {
  const res = await fetch(`${FLASK_URL}/api/notes/products/${encodeURIComponent(category)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  return res.json();
};

// Component Tabs
const TABS = [
  { id: "companies", label: "Company Notes", icon: Building2 },
  { id: "products", label: "Products & Vendors", icon: Package },
  { id: "meeting", label: "Meeting Prep", icon: ClipboardCheck },
];

// Company Notes Tab Component
function CompanyNotesTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTags, setNewNoteTags] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { data: companiesData } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  const { data: companyData } = useQuery({
    queryKey: ["company", selectedCompany],
    queryFn: () => fetchCompanyNotes(selectedCompany!),
    enabled: !!selectedCompany,
  });

  const addNoteMutation = useMutation({
    mutationFn: addCompanyNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", selectedCompany] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setNewNoteContent("");
      setNewNoteTags("");
      setIsAddingNote(false);
    },
  });

  const filteredCompanies = companiesData?.companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAddNote = () => {
    if (!selectedCompany || !newNoteContent.trim()) return;
    const tags = newNoteTags.split(",").map((t) => t.trim()).filter(Boolean);
    addNoteMutation.mutate({ name: selectedCompany, content: newNoteContent, tags });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-10rem)]">
      {/* Company List */}
      <div className="lg:col-span-1 bg-card rounded-lg border border-border overflow-hidden flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-full h-9 rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredCompanies.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No companies found
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <button
                key={company.name}
                onClick={() => {
                  setSelectedCompany(company.name);
                  setIsAddingNote(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors",
                  selectedCompany === company.name && "bg-accent"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{company.name}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {company.noteCount}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Company Notes Detail */}
      <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden flex flex-col">
        {selectedCompany ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{selectedCompany}</h3>
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Note
              </button>
            </div>

            {isAddingNote && (
              <div className="p-4 border-b border-border bg-accent/30">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter note content..."
                  className="w-full h-24 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <input
                  value={newNoteTags}
                  onChange={(e) => setNewNoteTags(e.target.value)}
                  placeholder="Tags (comma separated)..."
                  className="w-full mt-2 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim() || addNoteMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save Note
                  </button>
                  <button
                    onClick={() => setIsAddingNote(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {companyData?.notes?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No notes yet. Click "Add Note" to create one.
                </div>
              ) : (
                companyData?.notes?.map((note) => (
                  <div key={note.id} className="p-3 bg-background rounded-md border border-border">
                    <p className="text-sm text-foreground">{note.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {note.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a company to view notes
          </div>
        )}
      </div>
    </div>
  );
}

// Products Tab Component
function ProductsTab() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    vendor: "",
    partNumber: "",
    notes: "",
    tags: "",
  });

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categoryData } = useQuery({
    queryKey: ["productCategory", selectedCategory],
    queryFn: () => fetchProductCategory(selectedCategory!),
    enabled: !!selectedCategory,
  });

  const addItemMutation = useMutation({
    mutationFn: addProductItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCategory", selectedCategory] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setNewItem({ name: "", description: "", vendor: "", partNumber: "", notes: "", tags: "" });
      setIsAddingItem(false);
    },
  });

  const handleAddItem = () => {
    if (!selectedCategory || !newItem.name.trim()) return;
    const item = {
      ...newItem,
      tags: newItem.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    addItemMutation.mutate({ category: selectedCategory, item });
  };

  return (
    <div className="h-[calc(100vh-10rem)]">
      {!selectedCategory ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productsData?.categories?.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
            >
              <Package className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground capitalize">{cat.category.replace(/_/g, " ")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{cat.itemCount} items</p>
            </button>
          )) || (
            <div className="col-span-full text-center text-muted-foreground py-12">
              No product categories yet. Add items via the API.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border h-full flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setIsAddingItem(false);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <span className="text-muted-foreground">/</span>
              <h3 className="text-lg font-semibold text-foreground capitalize">{selectedCategory.replace(/_/g, " ")}</h3>
            </div>
            <button
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {isAddingItem && (
            <div className="p-4 border-b border-border bg-accent/30">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Product name"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  value={newItem.vendor}
                  onChange={(e) => setNewItem({ ...newItem, vendor: e.target.value })}
                  placeholder="Vendor"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  value={newItem.partNumber}
                  onChange={(e) => setNewItem({ ...newItem, partNumber: e.target.value })}
                  placeholder="Part number"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                  placeholder="Tags (comma separated)"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Description"
                  className="col-span-2 h-16 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Notes"
                  className="col-span-2 h-16 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.name.trim() || addItemMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Item
                </button>
                <button
                  onClick={() => setIsAddingItem(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {categoryData?.items?.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No items in this category. Click "Add Item" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryData?.items?.map((item) => (
                  <div key={item.id} className="p-4 bg-background rounded-md border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        {item.vendor && (
                          <p className="text-sm text-muted-foreground">Vendor: {item.vendor}</p>
                        )}
                        {item.partNumber && (
                          <p className="text-sm text-muted-foreground">Part #: {item.partNumber}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-foreground mt-2">{item.description}</p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                    )}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Meeting Prep Tab Component
function MeetingPrepTab() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const { data: templatesData } = useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
  });

  const { data: templateData } = useQuery({
    queryKey: ["template", selectedType],
    queryFn: () => fetchTemplate(selectedType!),
    enabled: !!selectedType,
  });

  const toggleCheck = (question: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(question)) {
      newChecked.delete(question);
    } else {
      newChecked.add(question);
    }
    setCheckedItems(newChecked);
  };

  const handleCopy = () => {
    if (!templateData) return;
    const text = [
      `# ${selectedType?.replace(/_/g, " ").toUpperCase()} CHECKLIST`,
      "",
      "## Questions:",
      ...templateData.questions.map((q, i) => `${checkedItems.has(q) ? "[x]" : "[ ]"} ${q}`),
      "",
      "## Tips:",
      ...templateData.tips.map((t) => `- ${t}`),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeIcons: Record<string, string> = {
    tanks: "🛢️",
    pumps: "⚙️",
    valves: "🔧",
    heat_exchangers: "🔥",
    strainers: "🗑️",
    instrumentation: "📊",
  };

  return (
    <div className="h-[calc(100vh-10rem)]">
      {!selectedType ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templatesData?.templates?.map((template) => (
            <button
              key={template.type}
              onClick={() => {
                setSelectedType(template.type);
                setCheckedItems(new Set());
              }}
              className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
            >
              <div className="text-3xl mb-2">{typeIcons[template.type] || "📋"}</div>
              <h3 className="font-semibold text-foreground capitalize">{template.type.replace(/_/g, " ")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {template.questionCount} questions · {template.tipCount} tips
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border h-full flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedType(null);
                  setCheckedItems(new Set());
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <span className="text-muted-foreground">/</span>
              <h3 className="text-lg font-semibold text-foreground capitalize">
                {typeIcons[selectedType]} {selectedType.replace(/_/g, " ")}
              </h3>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Checklist"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Questions
                </h4>
                <div className="space-y-2">
                  {templateData?.questions?.map((question, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-background rounded-md border border-border hover:border-primary/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems.has(question)}
                        onChange={() => toggleCheck(question)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className={cn("text-sm", checkedItems.has(question) && "line-through text-muted-foreground")}>
                        {question}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {templateData?.tips && templateData.tips.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Tips
                  </h4>
                  <div className="space-y-2">
                    {templateData.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-accent/30 rounded-md">
                        <span className="text-primary">💡</span>
                        <span className="text-sm text-foreground">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Page Component
export default function NotesPage() {
  const [activeTab, setActiveTab] = useState("companies");

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground mb-4">Notes & Knowledge Base</h1>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-card rounded-lg border border-border w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "companies" && <CompanyNotesTab />}
        {activeTab === "products" && <ProductsTab />}
        {activeTab === "meeting" && <MeetingPrepTab />}
      </div>
    </AppLayout>
  );
}
