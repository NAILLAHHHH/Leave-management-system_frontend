import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users } from "lucide-react";

// Types for proper type checking
interface LeaveType {
  id: number;
  name: string;
}

interface LeaveBalance {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType:  LeaveType | string;  // Changed from LeaveType | string to just string since API returns "PTO"
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  availableDays: number;
  carriedForwardDays: number;
  year: number;
}

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  leaveType: LeaveType | string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reason: string;
  comments: string;
  createdAt: string;
}

interface TeamMemberLeave {
  employeeId: number;
  employeeName: string;
  profilePicture?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState({
    balances: true,
    leaves: true
  });
  const [cancellingLeaveId, setCancellingLeaveId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(false);
  const [teamMembersOnLeave, setTeamMembersOnLeave] = useState<TeamMemberLeave[]>([]);
  const [loadingTeamLeaves, setLoadingTeamLeaves] = useState(true);

  // Fix the getLeaveTypeName function
  const getLeaveTypeName = (leaveType: string | { id: number; name: string } | null | undefined): string => {
    if (!leaveType) return "Unknown";
    if (typeof leaveType === "string") return leaveType;
    if (typeof leaveType === "object" && leaveType !== null && 'name' in leaveType) return leaveType.name;
    return "Unknown Leave Type";
  };

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch leave balances
        try {
          const balancesResponse = await axios.get('/api/leave-balances/my-balances');
          console.log('Leave balances raw response:', balancesResponse.data);
          // Make sure we're handling array of balances
          setLeaveBalances(balancesResponse.data || []);
          console.log('Processed balances:', balancesResponse.data);
        } catch (err) {
          console.error("Failed to fetch leave balances:", err);
          setLeaveBalances([]);
        }
        setLoading(prev => ({ ...prev, balances: false }));

        // Try to fetch leave history
        try {
          const leavesResponse = await axios.get('/api/leaves/my-leaves');
          setLeaveHistory(leavesResponse.data || []);
        } catch (err) {
          console.error("Failed to fetch leave history:", err);
          // Use empty array as fallback
          setLeaveHistory([]);
        }
        setLoading(prev => ({ ...prev, leaves: false }));

        // Add this section to fetch team members on leave
        try {
          const teamLeavesResponse = await axios.get('/api/leaves/current');
          console.log('Team leaves response:', teamLeavesResponse.data);
          setTeamMembersOnLeave(teamLeavesResponse.data);
        } catch (err) {
          console.error("Failed to fetch team leaves:", err);
          setTeamMembersOnLeave([]);
        }
        setLoadingTeamLeaves(false);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(true);
        setLoading({
          balances: false,
          leaves: false
        });
        setLoadingTeamLeaves(false);
      }
    };

    fetchData();
  }, []);

  const getPendingLeaves = () => {
    return leaveHistory.filter(leave => leave.status === "PENDING");
  };

  const getApprovedLeaves = () => {
    return leaveHistory.filter(leave => leave.status === "APPROVED");
  };
  
  const getRejectedLeaves = () => {
    return leaveHistory.filter(leave => leave.status === "REJECTED");
  };
  
  const getCancelledLeaves = () => {
    return leaveHistory.filter(leave => leave.status === "CANCELLED");
  };
  
  const handleCancelLeave = async (leaveId) => {
    setActionLoading(true);
    try {
      await axios.post(`/api/leaves/${leaveId}/cancel`);
      
      // Update the leave status locally
      setLeaveHistory(prevHistory => 
        prevHistory.map(leave => 
          leave.id === leaveId 
            ? { ...leave, status: "CANCELLED" } 
            : leave
        )
      );
      
    } catch (error) {
      console.error("Error cancelling leave request:", error);
      alert("Failed to cancel leave request. Please try again.");
    } finally {
      setActionLoading(false);
      setCancellingLeaveId(null);
    }
  };

  const handleApplyForLeave = () => {
    navigate("/apply-leave");
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Display a basic error state if there's a major error
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert className="mb-4">
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            There was a problem loading the dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with quick actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Employee Dashboard</h1>
        <Button onClick={handleApplyForLeave}>Apply for Leave</Button>
      </div>

      {/* Leave Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading.balances ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 rounded-full animate-spin"></div>
              </div>
            </CardContent>
          </Card>
        ) : leaveBalances.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <Alert>
                <AlertTitle>No leave balances found</AlertTitle>
                <AlertDescription>
                  Your leave balances have not been set up yet. Please contact HR.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          leaveBalances.map(balance => (
            <Card key={balance.id}>
              <CardHeader>
                <CardTitle>{getLeaveTypeName(balance.leaveType)}</CardTitle>
                <CardDescription>{balance.year}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Available: {balance.availableDays}/{balance.totalDays} days</span>
                      <span className="text-sm text-gray-500">
                        ({Math.round((balance.availableDays / balance.totalDays) * 100)}%)
                      </span>
                    </div>
                    <Progress value={(balance.availableDays / balance.totalDays) * 100} />
                  </div>
                  <div className="grid grid-cols-2 text-sm">
                    <div>Used: {balance.usedDays} days</div>
                    <div>Pending: {balance.pendingDays} days</div>
                  </div>
                  {balance.carriedForwardDays > 0 && (
                    <div className="text-sm text-blue-600">
                      Including {balance.carriedForwardDays} carried over days
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Leave Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Your recent and upcoming leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">
                    Pending <Badge variant="outline" className="ml-2">{getPendingLeaves().length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved <Badge variant="outline" className="ml-2">{getApprovedLeaves().length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected <Badge variant="outline" className="ml-2">{getRejectedLeaves().length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Cancelled <Badge variant="outline" className="ml-2">{getCancelledLeaves().length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                
                {loading.leaves ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <TabsContent value="pending">
                      {getPendingLeaves().length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No pending leave requests</p>
                      ) : (
                        <div className="space-y-4">
                          {getPendingLeaves().map(leave => (
                            <div key={leave.id} className="border rounded-md p-4">
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium">{getLeaveTypeName(leave.leaveType)}</h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    {leave.status}
                                  </Badge>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                      >
                                        Cancel
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to cancel this leave request? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleCancelLeave(leave.id)}
                                          disabled={actionLoading}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          {actionLoading && cancellingLeaveId === leave.id ? (
                                            <span className="flex items-center gap-1">
                                              <div className="w-3 h-3 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                              Cancelling...
                                            </span>
                                          ) : (
                                            "Yes, cancel it"
                                          )}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                              {leave.reason && (
                                <p className="text-sm mt-2 text-gray-700">
                                  <span className="font-medium">Reason:</span> {leave.reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="approved">
                      {getApprovedLeaves().length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No approved leave requests</p>
                      ) : (
                        <div className="space-y-4">
                          {getApprovedLeaves().map(leave => (
                            <div key={leave.id} className="border rounded-md p-4">
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium">{getLeaveTypeName(leave.leaveType)}</h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                  </p>
                                </div>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  {leave.status}
                                </Badge>
                              </div>
                              {leave.comments && (
                                <p className="text-sm mt-2 text-gray-700">
                                  <span className="font-medium">Comments:</span> {leave.comments}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="rejected">
                      {getRejectedLeaves().length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No rejected leave requests</p>
                      ) : (
                        <div className="space-y-4">
                          {getRejectedLeaves().map(leave => (
                            <div key={leave.id} className="border rounded-md p-4">
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium">{getLeaveTypeName(leave.leaveType)}</h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                  </p>
                                </div>
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                  {leave.status}
                                </Badge>
                              </div>
                              {leave.comments && (
                                <p className="text-sm mt-2 text-gray-700">
                                  <span className="font-medium">Reason for rejection:</span> {leave.comments}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="cancelled">
                      {getCancelledLeaves().length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No cancelled leave requests</p>
                      ) : (
                        <div className="space-y-4">
                          {getCancelledLeaves().map(leave => (
                            <div key={leave.id} className="border rounded-md p-4">
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium">{getLeaveTypeName(leave.leaveType)}</h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                  </p>
                                </div>
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                  {leave.status}
                                </Badge>
                              </div>
                              {leave.reason && (
                                <p className="text-sm mt-2 text-gray-700">
                                  <span className="font-medium">Original reason:</span> {leave.reason}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Cancelled on: {formatDate(leave.updatedAt || leave.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="all">
                      {leaveHistory.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No leave history found</p>
                      ) : (
                        <div className="space-y-4">
                          {leaveHistory.map(leave => (
                            <div key={leave.id} className="border rounded-md p-4">
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium">{getLeaveTypeName(leave.leaveType)}</h4>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                  </p>
                                </div>
                                <Badge 
                                  className={
                                    leave.status === "APPROVED" 
                                      ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                      : leave.status === "PENDING" 
                                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                        : leave.status === "REJECTED" 
                                          ? "bg-red-100 text-red-800 hover:bg-red-100"
                                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                  }
                                >
                                  {leave.status}
                                </Badge>
                              </div>
                              {(leave.reason || leave.comments) && (
                                <div className="text-sm mt-2 text-gray-700">
                                  {leave.reason && (
                                    <p><span className="font-medium">Reason:</span> {leave.reason}</p>
                                  )}
                                  {leave.comments && (
                                    <p><span className="font-medium">Comments:</span> {leave.comments}</p>
                                  )}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Applied on: {formatDate(leave.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Team Calendar</CardTitle>
              <CardDescription>Team members on leave and public holidays</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar />
              
              {/* Upcoming holidays - Empty placeholder */}
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Upcoming Holidays</h4>
                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="text-gray-400 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm text-center">Holiday information coming soon</p>
                  </div>
                </div>
              </div>
              
              {/* Team members on leave */}
              <div className="mt-6">
                <h4 className="font-medium text-sm mb-2">Team Members on Leave</h4>
                <div className="border rounded-md p-4">
                  {loadingTeamLeaves ? (
                    <div className="flex justify-center p-4">
                      <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : teamMembersOnLeave.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="text-gray-400 mb-2">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-gray-500 text-sm text-center">No team members currently on leave</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamMembersOnLeave.map((member) => (
                        <div key={`${member.employeeId}-${member.startDate}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              {member.profilePicture ? (
                                <AvatarImage src={member.profilePicture} alt={member.employeeName} />
                              ) : (
                                <AvatarFallback>{getInitials(member.employeeName)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.employeeName}</p>
                              <p className="text-xs text-gray-500">{getLeaveTypeName(member.leaveType)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{formatDate(member.startDate)}</p>
                            <p className="text-xs text-gray-500">to {formatDate(member.endDate)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;