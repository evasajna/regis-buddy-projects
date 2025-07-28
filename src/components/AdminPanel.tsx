import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataUpload from "./admin/DataUpload";
import CategoriesManagement from "./admin/CategoriesManagement";
import RegistrationsView from "./admin/RegistrationsView";

const AdminPanel = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-primary">Admin Panel</h2>
        <p className="text-muted-foreground">Manage the self-employment registration system</p>
      </div>

      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="uploads">Registered Data Uploads</TabsTrigger>
          <TabsTrigger value="categories">Employment Categories</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="uploads" className="space-y-4">
          <DataUpload />
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4">
          <CategoriesManagement />
        </TabsContent>
        
        <TabsContent value="registrations" className="space-y-4">
          <RegistrationsView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;