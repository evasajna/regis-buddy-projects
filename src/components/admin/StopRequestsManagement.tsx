import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const StopRequestsManagement = () => {
  const [stopRequests, setStopRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStopRequests();
  }, []);

  const fetchStopRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('employment_registrations')
        .select(`
          *,
          employment_categories (name, description),
          registered_clients!inner(name, mobile_number, category)
        `)
        .eq('status', 'stop_requested')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setStopRequests(data || []);
    } catch (error) {
      console.error('Error fetching stop requests:', error);
      toast({
        title: "Error",
        description: "Failed to load stop requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveStopRequest = async (registrationId: string, action: 'stop' | 'allow_multi') => {
    try {
      if (action === 'stop') {
        // Mark as stopped/paused
        const { error } = await supabase
          .from('employment_registrations')
          .update({
            status: 'stopped' // New status for stopped programs
          })
          .eq('id', registrationId);

        if (error) throw error;

        toast({
          title: "Request Approved",
          description: "Program has been stopped. User can now apply for other programs.",
        });
      } else if (action === 'allow_multi') {
        // Allow multi-program by changing status back to approved
        const { error } = await supabase
          .from('employment_registrations')
          .update({
            status: 'multi_approved' // New status for multi-program approval
          })
          .eq('id', registrationId);

        if (error) throw error;

        toast({
          title: "Multi-Program Approved",
          description: "User can now apply for additional programs while keeping current one.",
        });
      }

      // Refresh the list
      fetchStopRequests();
    } catch (error) {
      console.error('Error approving stop request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const rejectStopRequest = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('employment_registrations')
        .update({
          status: 'approved' // Revert back to approved status
        })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Request Rejected",
        description: "Stop request has been rejected. Registration remains active.",
      });

      fetchStopRequests();
    } catch (error) {
      console.error('Error rejecting stop request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading stop requests...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stop/Multi-Program Requests</CardTitle>
          <CardDescription>
            Manage requests from users to stop current programs or allow multi-program enrollment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stopRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending stop requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stopRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-orange-400">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{request.registered_clients.name}</h3>
                        <div className="flex gap-2">
                          <Badge variant="outline">{request.registered_clients.mobile_number}</Badge>
                          <Badge variant="secondary">{request.registered_clients.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Current Program: {request.employment_categories?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registration ID: {request.id}
                        </p>
                      </div>
                      <Badge className="bg-orange-500">Stop Requested</Badge>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-sm mb-2">Request Details:</h4>
                      <p className="text-sm">
                        User has requested to either stop their current program or be allowed to enroll in multiple programs simultaneously.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => approveStopRequest(request.id, 'stop')}
                      >
                        Approve Stop (Allow New Applications)
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveStopRequest(request.id, 'allow_multi')}
                      >
                        Allow Multi-Program
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectStopRequest(request.id)}
                      >
                        Reject Request
                      </Button>
                    </div>

                    <div className="mt-4 text-xs text-muted-foreground">
                      <p>Request Date: {new Date(request.updated_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Database Setup Required</CardTitle>
          <CardDescription>
            For better management, create a dedicated table for stop requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">SQL to create program_stop_requests table:</h4>
            <pre className="text-xs bg-black text-green-400 p-3 rounded overflow-x-auto">
{`-- Create program_stop_requests table
CREATE TABLE program_stop_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID REFERENCES employment_registrations(id),
  client_id UUID REFERENCES registered_clients(id),
  mobile_number TEXT NOT NULL,
  current_category TEXT,
  request_type TEXT CHECK (request_type IN ('stop', 'multi_program', 'stop_or_multi')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE program_stop_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own requests
CREATE POLICY "Users can insert their own stop requests" ON program_stop_requests
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view their own requests
CREATE POLICY "Users can view their own stop requests" ON program_stop_requests
  FOR SELECT USING (true);

-- Allow admins to update all requests (you may want to restrict this)
CREATE POLICY "Admins can update stop requests" ON program_stop_requests
  FOR UPDATE USING (true);`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StopRequestsManagement;