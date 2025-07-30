import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'category' | 'sub_project' | 'program';
  target_id: string;
  target_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
}

interface SubProject {
  id: string;
  name: string;
  category_id: string;
}

interface Program {
  id: string;
  name: string;
  category_id: string;
}

const NotificationManager = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "" as 'category' | 'sub_project' | 'program' | "",
    target_id: "",
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch notifications from the database
      const { data: notificationData, error: notificationError } = await (supabase as any)
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notificationError) {
        console.error('Error fetching notifications:', notificationError);
        setNotifications([]);
      } else {
        setNotifications(notificationData || []);
      }

      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('employment_categories')
        .select('id, name')
        .eq('is_active', true);

      if (categoryError) throw categoryError;
      setCategories(categoryData || []);

      // Fetch sub projects
      const { data: subProjectData, error: subProjectError } = await supabase
        .from('sub_projects')
        .select('id, name, category_id');

      if (subProjectError) throw subProjectError;
      setSubProjects(subProjectData || []);

      // Fetch programs
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('id, name, category_id');

      if (programError) throw programError;
      setPrograms(programData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message || !formData.type || !formData.target_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingNotification) {
        const { error } = await (supabase as any)
          .from('notifications')
          .update({
            title: formData.title,
            message: formData.message,
            type: formData.type,
            target_id: formData.target_id,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNotification.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        toast({
          title: "Success",
          description: "Notification updated successfully",
        });
      } else {
        // For insert, let's try a simpler approach first
        const { error } = await (supabase as any)
          .from('notifications')
          .insert([{
            title: formData.title,
            message: formData.message,
            type: formData.type,
            target_id: formData.target_id,
            is_active: formData.is_active
          }]);

        if (error) {
          console.error('Insert error:', error);
          // If there's a permission error, it might be RLS policy issue
          if (error.code === '42501') {
            toast({
              title: "Database Permission Error",
              description: "Please check the RLS policies for the notifications table. You may need to disable RLS temporarily or update the policies.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Success",
          description: "Notification created successfully",
        });
      }

      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: "Error",
        description: "Failed to save notification",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      target_id: notification.target_id,
      is_active: notification.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "",
      target_id: "",
      is_active: true
    });
    setEditingNotification(null);
  };

  const getTargetName = (notification: Notification) => {
    switch (notification.type) {
      case 'category':
        return categories.find(c => c.id === notification.target_id)?.name || 'Unknown Category';
      case 'sub_project':
        return subProjects.find(s => s.id === notification.target_id)?.name || 'Unknown Sub-Project';
      case 'program':
        return programs.find(p => p.id === notification.target_id)?.name || 'Unknown Program';
      default:
        return 'Unknown';
    }
  };

  const getAvailableTargets = () => {
    switch (formData.type) {
      case 'category':
        return categories;
      case 'sub_project':
        return subProjects;
      case 'program':
        return programs;
      default:
        return [];
    }
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Notification Manager
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Notification
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications found. Create your first notification!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{notification.type}</Badge>
                      </TableCell>
                      <TableCell>{getTargetName(notification)}</TableCell>
                      <TableCell>
                        <Badge variant={notification.is_active ? "default" : "secondary"}>
                          {notification.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(notification.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(notification)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? "Edit Notification" : "Add New Notification"}
            </DialogTitle>
            <DialogDescription>
              {editingNotification ? "Update the notification details below." : "Create a new notification for a category, sub-project, or program."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title"
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Notification message"
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'category' | 'sub_project' | 'program') => 
                  setFormData(prev => ({ ...prev, type: value, target_id: "" }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="sub_project">Sub-Project</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type && (
              <div>
                <Label htmlFor="target">Target {formData.type.replace('_', ' ')}</Label>
                <Select
                  value={formData.target_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, target_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${formData.type.replace('_', ' ')}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTargets().map((target) => (
                      <SelectItem key={target.id} value={target.id}>
                        {target.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingNotification ? "Update" : "Create"} Notification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationManager;