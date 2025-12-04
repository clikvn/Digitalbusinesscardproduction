import React, { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Plus, FolderPlus, Pencil, Trash2, X, Check } from "lucide-react";
import { PortfolioItem as PortfolioItemType, PortfolioCategory, BusinessCardData } from "../../../types/business-card";
import { InlinePortfolioItemForm } from "../InlinePortfolioItemForm";
import { SortablePortfolioItem } from "../SortablePortfolioItem";
import { SortableCategoryTab } from "../SortableCategoryTab";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog";

interface PortfolioFormProps {
  data: BusinessCardData['portfolio'];
  categories: PortfolioCategory[];
  onChange: (data: BusinessCardData['portfolio']) => void;
  onCategoriesChange: (categories: PortfolioCategory[]) => void;
  onFieldFocus?: (field: { label: string; value: string; onApply: (value: string) => void }) => void;
}

export function PortfolioForm({ data, categories, onChange, onCategoriesChange, onFieldFocus }: PortfolioFormProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState<PortfolioItemType | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Update activeCategory when categories change
  useEffect(() => {
    if (!activeCategory || !categories.find(c => c.id === activeCategory)) {
      setActiveCategory(categories[0]?.id || '');
    }
  }, [categories, activeCategory]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredData.findIndex((item) => item.id === active.id);
      const newIndex = filteredData.findIndex((item) => item.id === over.id);
      
      // Get the complete data array and update it
      const allItems = [...data];
      const activeItem = allItems.find(item => item.id === active.id);
      const overItem = allItems.find(item => item.id === over.id);
      
      if (activeItem && overItem) {
        const oldGlobalIndex = allItems.indexOf(activeItem);
        const newGlobalIndex = allItems.indexOf(overItem);
        onChange(arrayMove(allItems, oldGlobalIndex, newGlobalIndex));
      }
    }
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onCategoriesChange(arrayMove(categories, oldIndex, newIndex));
      }
    }
  };

  const handleCreate = () => {
    const item: PortfolioItemType = {
      id: `portfolio-${Date.now()}`,
      type: 'images',
      title: "",
      description: "",
      categoryId: activeCategory || categories[0]?.id || '',
      images: []
    };
    setNewItem(item);
    setIsCreating(true);
  };

  const handleEdit = (item: PortfolioItemType) => {
    setEditingItemId(item.id);
    setIsCreating(false);
  };

  const handleSaveNew = (item: PortfolioItemType) => {
    onChange([...data, item]);
    setNewItem(null);
    setIsCreating(false);
  };

  const handleSaveEdit = (item: PortfolioItemType) => {
    onChange(data.map(i => i.id === item.id ? item : i));
    setEditingItemId(null);
  };

  const handleCancelNew = () => {
    setNewItem(null);
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleDelete = (id: string) => {
    onChange(data.filter(item => item.id !== id));
  };

  const handleDuplicate = (item: PortfolioItemType) => {
    const duplicated: PortfolioItemType = {
      ...item,
      id: `portfolio-${Date.now()}`,
      title: `${item.title} (Copy)`,
      // Ensure all type-specific fields are copied
      type: item.type,
      images: item.images ? [...item.images] : undefined,
      videoUrl: item.videoUrl,
      tourUrl: item.tourUrl
    };
    onChange([...data, duplicated]);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: PortfolioCategory = {
      id: `category-${Date.now()}`,
      name: newCategoryName.trim()
    };
    
    onCategoriesChange([...categories, newCategory]);
    setNewCategoryName('');
    setIsAddingCategory(false);
    setActiveCategory(newCategory.id);
  };

  const handleEditCategory = (id: string, name: string) => {
    if (!name.trim()) return;
    
    onCategoriesChange(
      categories.map(cat => cat.id === id ? { ...cat, name: name.trim() } : cat)
    );
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = (id: string) => {
    // Find the first remaining category (that's not the one being deleted)
    const remainingCategories = categories.filter(cat => cat.id !== id);
    const firstRemainingCategory = remainingCategories[0];
    
    // Move all items in this category to the first remaining category
    const updatedItems = data.map(item => 
      item.categoryId === id 
        ? { ...item, categoryId: firstRemainingCategory?.id || '' } 
        : item
    );
    onChange(updatedItems);
    
    // Remove the category
    onCategoriesChange(remainingCategories);
    
    // Switch to first remaining category
    setActiveCategory(firstRemainingCategory?.id || '');
    setCategoryToDelete(null);
  };

  const filteredData = data.filter(item => item.categoryId === activeCategory);

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4">
        {categories.length === 0 ? (
          <Card className="border-[#e4e4e7] shadow-sm">
            <CardContent className="px-4 md:px-6 py-12">
              <Button 
                onClick={() => setIsAddingCategory(true)} 
                variant="outline"
                className="w-full border-dashed border-2 hover:bg-[#535146]/5"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <div className="overflow-x-auto pt-[30px] pr-[0px] pb-[0px] pl-[0px] mx-[0px] my-[-16px]">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={categories.map(cat => cat.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <TabsList className="w-max min-w-full justify-start h-auto gap-1 bg-[#f4f4f5] p-1 relative">
                    {categories.map((category) => (
                      editingCategoryId === category.id ? (
                        <div key={category.id} className="flex items-center gap-1 bg-white rounded-md px-2 py-1">
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditCategory(category.id, newCategoryName);
                              } else if (e.key === 'Escape') {
                                setEditingCategoryId(null);
                                setNewCategoryName('');
                              }
                            }}
                            className="h-7 w-32 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEditCategory(category.id, newCategoryName)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setNewCategoryName('');
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <SortableCategoryTab
                          key={category.id}
                          category={category}
                          onEdit={(id, name) => {
                            setEditingCategoryId(id);
                            setNewCategoryName(name);
                          }}
                          onDelete={(id) => setCategoryToDelete(id)}
                        />
                      )
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsAddingCategory(true)}
                      className="h-9 w-9 p-0 hover:bg-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TabsList>
                </SortableContext>
              </DndContext>
            </div>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="mt-4">
                  <div className="space-y-3">
                    {/* Add Item Button - shown at top of list when there are items */}
                    {filteredData.length > 0 && !isCreating && (
                      <Button
                        onClick={handleCreate}
                        variant="outline"
                        className="w-full border-dashed border-2 hover:bg-[#535146]/5"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    )}

                    {/* Inline New Item Form */}
                    {isCreating && newItem && (
                      <InlinePortfolioItemForm
                        item={newItem}
                        onSave={handleSaveNew}
                        onCancel={handleCancelNew}
                      />
                    )}

                    {/* Empty state */}
                    {filteredData.length === 0 && !isCreating && (
                      <Button
                        onClick={handleCreate}
                        variant="outline"
                        className="w-full border-dashed border-2 hover:bg-[#535146]/5"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    )}

                    {/* Portfolio Items List */}
                    {filteredData.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={filteredData.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {filteredData.map((item) => (
                              editingItemId === item.id ? (
                                <InlinePortfolioItemForm
                                  key={item.id}
                                  item={item}
                                  onSave={handleSaveEdit}
                                  onCancel={handleCancelEdit}
                                />
                              ) : (
                                <SortablePortfolioItem
                                  key={item.id}
                                  item={item}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  onDuplicate={handleDuplicate}
                                />
                              )
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your portfolio items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
                placeholder="e.g., Residential, Commercial, Modern"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1"
              >
                Add Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={categoryToDelete !== null} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move all items in this category to the first remaining category. The items themselves will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </>
  );
}
