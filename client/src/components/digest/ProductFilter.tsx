import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";

const ALL_PRODUCTS = [
  "Hiring",
  "HRIS",
  "Time & Scheduling",
  "Payroll",
  "Benefits",
  "Mobile Worker App",
  "Platform",
  "Tip Management (Beta)",
  "Compliance Shield (Beta)",
  "Manager Logbook (Beta)",
];

interface ProductFilterProps {
  selectedProducts: string[];
  onSelectionChange: (products: string[]) => void;
}

function getDisplayLabel(selected: string[]): string {
  if (selected.length === 0 || selected.length === ALL_PRODUCTS.length) return "All Products";
  if (selected.includes("__none__")) return "No Products";
  if (selected.length === 1) return selected[0];
  if (selected.length === 2) return `${selected[0]} + 1`;
  return `${selected.length} products`;
}

export function ProductFilter({ selectedProducts, onSelectionChange }: ProductFilterProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return ALL_PRODUCTS;
    return ALL_PRODUCTS.filter((p) =>
      p.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const toggleProduct = (product: string) => {
    if (selectedProducts.includes(product)) {
      onSelectionChange(selectedProducts.filter((p) => p !== product));
    } else {
      onSelectionChange([...selectedProducts, product]);
    }
  };

  const isAllSelected = selectedProducts.length === 0;

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange([]);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange(["__none__"]);
  };

  const isProductChecked = (product: string) => {
    if (selectedProducts.includes("__none__")) return false;
    if (selectedProducts.length === 0) return true;
    return selectedProducts.includes(product);
  };

  const handleToggle = (product: string) => {
    if (selectedProducts.includes("__none__")) {
      onSelectionChange([product]);
      return;
    }
    if (selectedProducts.length === 0) {
      const allExcept = ALL_PRODUCTS.filter((p) => p !== product);
      onSelectionChange(allExcept);
    } else if (selectedProducts.includes(product)) {
      const remaining = selectedProducts.filter((p) => p !== product);
      if (remaining.length === 0) {
        onSelectionChange(["__none__"]);
      } else {
        onSelectionChange(remaining);
      }
    } else {
      const next = [...selectedProducts, product];
      if (next.length === ALL_PRODUCTS.length) {
        onSelectionChange([]);
      } else {
        onSelectionChange(next);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[180px] justify-between text-sm font-normal"
          data-testid="product-filter"
        >
          <span className="truncate">{getDisplayLabel(selectedProducts)}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
              data-testid="product-search"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <button
            type="button"
            onClick={handleSelectAll}
            className={`text-xs hover:underline ${isAllSelected ? "text-muted-foreground" : "text-primary"}`}
            data-testid="product-select-all"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className={`text-xs hover:underline ${selectedProducts.includes("__none__") ? "text-muted-foreground" : "text-primary"}`}
            data-testid="product-clear-all"
          >
            Clear all
          </button>
        </div>

        <div className="p-1 max-h-[240px] overflow-y-auto">
          {filteredProducts.map((product) => {
            const checked = isProductChecked(product);
            return (
              <label
                key={product}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted cursor-pointer text-sm"
                data-testid={`product-option-${product.toLowerCase().replace(/[& ]+/g, '-')}`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleToggle(product)}
                />
                <span>{product}</span>
              </label>
            );
          })}
          {filteredProducts.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              No products match your search.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
