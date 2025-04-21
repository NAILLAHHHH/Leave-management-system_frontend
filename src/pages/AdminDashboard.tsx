import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, Calendar, Users, FileText, RefreshCw, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { saveAs } from 'file-saver';

// Add this helper function after the imports and before the AdminDashboard component
const convertToCSV = (leaves: LeaveRequest[]): string => {
  const headers = [
    'Employee Name',
    'Email',
    'Leave Type',
    'Start Date',
    'End Date',
    'Duration',
    'Status',
    'Reason',
    'Approver',
    'Applied On'
  ].join(',');

  const rows = leaves.map(leave => {
    return [
      `"${getEmployeeDisplayName(leave)}"`,
      `"${leave.employee?.email || ''}"`,
      `"${getLeaveTypeName(leave.leaveType)}"`,
      `"${formatDate(leave.startDate)}"`,
      `"${formatDate(leave.endDate)}"`,
      `"${calculateLeaveDuration(leave)}"`,
      `"${leave.status}"`,
      `"${leave.reason?.replace(/"/g, '""') || ''}"`,
      `"${getApproverDisplayName(leave)}"`,
      `"${formatDate(leave.createdAt)}"`
    ].join(',');
  });

  return [headers, ...rows].join('\n');
};

// Types
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: {
    id: number;
    roleName: string;
  };
  profilePicture?: string;
}

interface LeaveRequest {
  id: number;
  employeeId?: number;
  employeeName?: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  leaveType: string | { id: number; name: string } | null;
  startDate: string;
  endDate: string;
  halfDay: boolean;
  halfDayPeriod?: string;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approver?: {
    id: number;
    firstName: string;
    lastName: string;
  } | number | null;
  supportingDocumentPath?: string | null;
  approvedBy?: number | null;
  rejectionReason?: string | null;
  comments?: string;
  documentId?: number;
  createdAt: string;
  updatedAt?: string | null;
}

interface LeaveType {
  id: number;
  name: string;
  maxDaysPerYear: number;
  requiresDocument: boolean;
  description?: string;
}

interface LeaveTypeFormData {
  id?: number;
  name: string;
  maxDaysPerYear: number;
  requiresDocument: boolean;
  description?: string;
}

// Add these helper functions after the interfaces and before the AdminDashboard component
const getEmployeeDisplayName = (leave: LeaveRequest): string => {
  if (leave.employeeName) {
    return leave.employeeName;
  }
  
  if (leave.employee) {
    const firstName = leave.employee.firstName || '';
    const lastName = leave.employee.lastName || '';
    
    if (!firstName && !lastName) return "Unknown Employee";
    return `${firstName} ${lastName}`.trim();
  }
  
  return "Unknown Employee";
};

const getLeaveTypeName = (leaveType: string | { id: number; name: string } | null | undefined): string => {
  if (!leaveType) return "Unknown";
  if (typeof leaveType === 'string') return leaveType;
  if (typeof leaveType === 'object' && leaveType !== null && 'name' in leaveType) return leaveType.name;
  return "Unknown";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString || "N/A";
  }
};

const calculateLeaveDuration = (leave: LeaveRequest): number => {
  if (!leave) return 0;
  if (leave.halfDay) return 0.5;
  
  try {
    if (!leave.startDate || !leave.endDate) return 0;
    
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  } catch (error) {
    console.error("Error calculating leave duration:", error);
    return 0;
  }
};

const getApproverDisplayName = (leave: LeaveRequest): string => {
  if (leave.approver && typeof leave.approver === 'object' && 'firstName' in leave.approver) {
    const firstName = leave.approver.firstName || '';
    const lastName = leave.approver.lastName || '';
    return `${firstName} ${lastName}`.trim() || "Unknown";
  }
  
  if (leave.approvedBy) {
    return `Admin ID: ${leave.approvedBy}`;
  }
  
  if (typeof leave.approver === 'number') {
    return `Admin ID: ${leave.approver}`;
  }
  
  return "N/A";
};

const AdminDashboard = () => {
  // State
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [loading, setLoading] = useState({
    pending: true,
    all: true,
    leaveTypes: true,
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showLeaveTypeDialog, setShowLeaveTypeDialog] = useState(false);
  const [showDeleteLeaveTypeDialog, setShowDeleteLeaveTypeDialog] = useState(false);
  const [leaveTypeFormData, setLeaveTypeFormData] = useState<LeaveTypeFormData>({
    name: '',
    maxDaysPerYear: 0,
    requiresDocument: false,
    description: ''
  });
  const [leaveTypeToDelete, setLeaveTypeToDelete] = useState<LeaveType | null>(null);
  const [isEditingLeaveType, setIsEditingLeaveType] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pending leaves for approval
        try {
          const pendingResponse = await axios.get('/api/leaves/pending-approval');
          setPendingLeaves(pendingResponse.data);
        } catch (error) {
          console.error("Error fetching pending leaves:", error);
          setPendingLeaves([]);
        }
        setLoading(prev => ({ ...prev, pending: false }));

        // Fetch all leaves
        try {
          const allLeavesResponse = await axios.get('/api/leaves/all');
          setAllLeaves(allLeavesResponse.data);
        } catch (error) {
          console.error("Error fetching all leaves:", error);
          setAllLeaves([]);
        }
        setLoading(prev => ({ ...prev, all: false }));

        // Fetch leave types
        try {
          const leaveTypesResponse = await axios.get('/api/leave-types');
          setLeaveTypes(leaveTypesResponse.data);
        } catch (error) {
          console.error("Error fetching leave types:", error);
          setLeaveTypes([]);
        }
        setLoading(prev => ({ ...prev, leaveTypes: false }));

      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        setActionError("Failed to load data. Please refresh the page.");
        setLoading({
          pending: false,
          all: false,
          leaveTypes: false,
        });
      }
    };

    fetchData();
  }, []);

  // Handle leave approval
  const handleApproveLeave = async () => {
    if (!selectedLeave) return;
    
    try {
      const response = await axios.post(
        `/api/leaves/${selectedLeave.id}/approve`, 
        null,
        { params: { comment: approveComment } }
      );
      
      // Update leave lists
      setPendingLeaves(prev => prev.filter(leave => leave.id !== selectedLeave.id));
      setAllLeaves(prev => 
        prev.map(leave => 
          leave.id === selectedLeave.id ? response.data : leave
        )
      );
      
      setActionSuccess("Leave request approved successfully");
      setShowApproveDialog(false);
      setApproveComment("");
      setSelectedLeave(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error("Error approving leave:", error);
      setActionError("Failed to approve leave request");
      
      // Clear error message after 3 seconds
      setTimeout(() => setActionError(null), 3000);
    }
  };

  // Handle leave rejection
  const handleRejectLeave = async () => {
    if (!selectedLeave || !rejectReason) return;
    
    try {
      const response = await axios.post(
        `/api/leaves/${selectedLeave.id}/reject`, 
        null,
        { params: { reason: rejectReason } }
      );
      
      // Update leave lists
      setPendingLeaves(prev => prev.filter(leave => leave.id !== selectedLeave.id));
      setAllLeaves(prev => 
        prev.map(leave => 
          leave.id === selectedLeave.id ? response.data : leave
        )
      );
      
      setActionSuccess("Leave request rejected successfully");
      setShowRejectDialog(false);
      setRejectReason("");
      setSelectedLeave(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error("Error rejecting leave:", error);
      setActionError("Failed to reject leave request");
      
      // Clear error message after 3 seconds
      setTimeout(() => setActionError(null), 3000);
    }
  };

  // Handle fixing leave balances
  const handleFixLeaveBalances = async () => {
    try {
      const response = await axios.post('/api/leaves/fix-balances');
      setActionSuccess(response.data || "Leave balances fixed successfully");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error("Error fixing leave balances:", error);
      setActionError("Failed to fix leave balances");
      setTimeout(() => setActionError(null), 3000);
    }
  };

  // Leave Type Management Functions
  const handleLeaveTypeFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setLeaveTypeFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCreateLeaveType = async () => {
    try {
      const response = await axios.post('/api/leave-types', leaveTypeFormData);
      setLeaveTypes(prev => [...prev, response.data]);
      setShowLeaveTypeDialog(false);
      setActionSuccess('Leave type created successfully');
      resetLeaveTypeForm();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating leave type:', error);
      setActionError('Failed to create leave type');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleUpdateLeaveType = async () => {
    if (!leaveTypeFormData.id) return;
    
    try {
      const response = await axios.put(`/api/leave-types/${leaveTypeFormData.id}`, leaveTypeFormData);
      setLeaveTypes(prev => 
        prev.map(lt => lt.id === response.data.id ? response.data : lt)
      );
      setShowLeaveTypeDialog(false);
      setActionSuccess('Leave type updated successfully');
      resetLeaveTypeForm();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating leave type:', error);
      setActionError('Failed to update leave type');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleDeleteLeaveType = async () => {
    if (!leaveTypeToDelete) return;
    
    try {
      await axios.delete(`/api/leave-types/${leaveTypeToDelete.id}`);
      setLeaveTypes(prev => prev.filter(lt => lt.id !== leaveTypeToDelete.id));
      setShowDeleteLeaveTypeDialog(false);
      setActionSuccess('Leave type deleted successfully');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting leave type:', error);
      setActionError('Failed to delete leave type');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const resetLeaveTypeForm = () => {
    setLeaveTypeFormData({
      name: '',
      maxDaysPerYear: 0,
      requiresDocument: false,
      description: ''
    });
    setIsEditingLeaveType(false);
  };

  const handleEditLeaveType = (leaveType: LeaveType) => {
    setLeaveTypeFormData({
      id: leaveType.id,
      name: leaveType.name,
      maxDaysPerYear: leaveType.maxDaysPerYear,
      requiresDocument: leaveType.requiresDocument,
      description: leaveType.description || ''
    });
    setIsEditingLeaveType(true);
    setShowLeaveTypeDialog(true);
  };

  // Helper Functions
  const getInitials = (leave: LeaveRequest): string => {
    if (leave.employeeName) {
      try {
        const nameParts = leave.employeeName.split(' ');
        if (nameParts.length >= 2) {
          return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        } else if (nameParts.length === 1 && nameParts[0]) {
          return nameParts[0][0].toUpperCase();
        }
      } catch (error) {
        console.error("Error generating initials from employeeName:", error);
      }
    }
    
    if (leave.employee) {
      try {
        const firstInitial = leave.employee.firstName ? leave.employee.firstName[0] : '';
        const lastInitial = leave.employee.lastName ? leave.employee.lastName[0] : '';
        const initials = `${firstInitial}${lastInitial}`.toUpperCase();
        return initials || "??";
      } catch (error) {
        console.error("Error generating initials from employee object:", error);
      }
    }
    
    return "??";
  };
  
  const getFilteredLeaves = () => {
    if (!allLeaves || !Array.isArray(allLeaves)) {
      return [];
    }
    
    if (filterStatus === "all") {
      return allLeaves;
    }
    
    return allLeaves.filter(leave => leave && leave.status === filterStatus);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "REJECTED":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Add this function inside the AdminDashboard component, after the other handler functions
  const handleExportCSV = () => {
    const csvData = convertToCSV(getFilteredLeaves());
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    const fileName = `leave-requests-${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, fileName);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="space-x-2">
          <Button 
            variant="outline"
            onClick={handleFixLeaveBalances}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Fix Leave Balances
          </Button>
        </div>
      </div>

      {/* Success/Error messages */}
      {actionSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{actionSuccess}</AlertDescription>
        </Alert>
      )}
      
      {actionError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              {pendingLeaves.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves.length}</div>
            <p className="text-xs text-gray-500">Require your action</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leave Types</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveTypes.length}</div>
            <p className="text-xs text-gray-500">Available for employees</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allLeaves.filter(leave => {
                const today = new Date().toISOString().split('T')[0];
                const startDate = new Date(leave.startDate).toISOString().split('T')[0];
                const endDate = new Date(leave.endDate).toISOString().split('T')[0];
                return leave.status === "APPROVED" && 
                       startDate <= today && 
                       endDate >= today;
              }).length}
            </div>
            <p className="text-xs text-gray-500">Currently on leave</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="all">All Leaves</TabsTrigger>
          <TabsTrigger value="leaveTypes">Leave Types</TabsTrigger>
        </TabsList>
        
        {/* Pending Approvals Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>Leave requests waiting for your approval</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.pending ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 rounded-full animate-spin"></div>
                </div>
              ) : pendingLeaves.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending leave requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLeaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={leave.employee?.profilePicture} />
                                <AvatarFallback>
                                  {getInitials(leave)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div>{getEmployeeDisplayName(leave)}</div>
                                <div className="text-xs text-gray-500">
                                  {leave.employee?.email || (leave.employeeId ? `ID: ${leave.employeeId}` : 'No email')}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getLeaveTypeName(leave.leaveType)}</TableCell>
                          <TableCell>
                            {formatDate(leave.startDate)}
                            {!leave.halfDay && ` to ${formatDate(leave.endDate)}`}
                            {leave.halfDay && ` (${leave.halfDayPeriod})`}
                          </TableCell>
                          <TableCell>{calculateLeaveDuration(leave)}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {leave.reason || "No reason provided"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 px-2 text-green-600"
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setShowApproveDialog(true);
                                }}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 px-2 text-red-600"
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setShowRejectDialog(true);
                                }}
                              >
                                Reject
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
        </TabsContent>
        
        {/* All Leaves Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader className="flex justify-between">
              <div>
                <CardTitle>All Leave Requests</CardTitle>
                <CardDescription>Complete history of leave requests</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Add the Export button here */}
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV}
                  className="mr-2"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Label htmlFor="status-filter">Filter by Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading.all ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 rounded-full animate-spin"></div>
                </div>
              ) : allLeaves.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No leave requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Approver</TableHead>
                        <TableHead>Applied On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredLeaves().map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={leave.employee?.profilePicture} />
                                <AvatarFallback>
                                  {getInitials(leave)}
                                </AvatarFallback>
                              </Avatar>
                              </div>
                              <div>{getEmployeeDisplayName(leave)}</div>
                            </TableCell>
                            <TableCell>{getLeaveTypeName(leave.leaveType)}</TableCell>
                            <TableCell>
                              {formatDate(leave.startDate)}
                              {!leave.halfDay && leave.endDate && ` to ${formatDate(leave.endDate)}`}
                              {leave.halfDay && leave.halfDayPeriod && ` (${leave.halfDayPeriod})`}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeClass(leave.status)}>
                                {leave.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getApproverDisplayName(leave)}
                            </TableCell>
                            <TableCell>{leave.createdAt ? formatDate(leave.createdAt) : 'Unknown'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Leave Types Tab */}
          <TabsContent value="leaveTypes">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Leave Types</CardTitle>
                  <CardDescription>Available leave types in the system</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    resetLeaveTypeForm();
                    setShowLeaveTypeDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Leave Type
                </Button>
              </CardHeader>
              <CardContent>
                {loading.leaveTypes ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 rounded-full animate-spin"></div>
                  </div>
                ) : leaveTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No leave types found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Max Days/Year</TableHead>
                          <TableHead>Requires Document</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaveTypes.map((type) => (
                          <TableRow key={type.id}>
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell>{type.maxDaysPerYear}</TableCell>
                            <TableCell>{type.requiresDocument ? "Yes" : "No"}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {type.description || "No description"}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditLeaveType(type)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    setLeaveTypeToDelete(type);
                                    setShowDeleteLeaveTypeDialog(true);
                                  }}
                                >
                                  Delete
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
          </TabsContent>
        </Tabs>
  
        {/* Approve Leave Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Leave Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this leave request?
              </DialogDescription>
            </DialogHeader>
            
            {selectedLeave && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedLeave.employee?.profilePicture} />
                    <AvatarFallback>
                      {getInitials(selectedLeave)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {getEmployeeDisplayName(selectedLeave)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedLeave.employee?.email || (selectedLeave.employeeId ? `ID: ${selectedLeave.employeeId}` : 'No email')}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Leave Type</Label>
                    <div>{getLeaveTypeName(selectedLeave.leaveType)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Date Range</Label>
                    <div>
                      {formatDate(selectedLeave.startDate)}
                      {!selectedLeave.halfDay && ` to ${formatDate(selectedLeave.endDate)}`}
                      {selectedLeave.halfDay && ` (${selectedLeave.halfDayPeriod})`}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="approveComment">Comments (Optional)</Label>
                  <Textarea
                    id="approveComment"
                    placeholder="Add any comments about this approval"
                    value={approveComment}
                    onChange={(e) => setApproveComment(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApproveLeave}>
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  
        {/* Reject Leave Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Leave Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this leave request.
              </DialogDescription>
            </DialogHeader>
            
            {selectedLeave && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedLeave.employee?.profilePicture} />
                    <AvatarFallback>
                      {getInitials(selectedLeave)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {getEmployeeDisplayName(selectedLeave)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedLeave.employee?.email || (selectedLeave.employeeId ? `ID: ${selectedLeave.employeeId}` : 'No email')}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Leave Type</Label>
                    <div>{getLeaveTypeName(selectedLeave.leaveType)}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Date Range</Label>
                    <div>
                      {formatDate(selectedLeave.startDate)}
                      {!selectedLeave.halfDay && ` to ${formatDate(selectedLeave.endDate)}`}
                      {selectedLeave.halfDay && ` (${selectedLeave.halfDayPeriod})`}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="rejectReason" className="text-red-500">Reason (Required)</Label>
                  <Textarea
                    id="rejectReason"
                    placeholder="Provide reason for rejection"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="border-red-200 focus:ring-red-500"
                    required
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejectLeave}
                disabled={!rejectReason}
              >
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  
        {/* Create/Edit Leave Type Dialog */}
        <Dialog open={showLeaveTypeDialog} onOpenChange={setShowLeaveTypeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditingLeaveType ? 'Edit Leave Type' : 'Create New Leave Type'}
              </DialogTitle>
              <DialogDescription>
                {isEditingLeaveType 
                  ? 'Modify the details of this leave type'
                  : 'Add a new leave type to the system'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Leave Type Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={leaveTypeFormData.name}
                    onChange={handleLeaveTypeFormChange}
                    placeholder="e.g., Annual Leave"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDaysPerYear">Max Days Per Year</Label>
                  <Input
                    id="maxDaysPerYear"
                    name="maxDaysPerYear"
                    type="number"
                    min="0"
                    value={leaveTypeFormData.maxDaysPerYear}
                    onChange={handleLeaveTypeFormChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresDocument"
                  name="requiresDocument"
                  checked={leaveTypeFormData.requiresDocument}
                  onCheckedChange={(checked) => 
                    setLeaveTypeFormData(prev => ({
                      ...prev,
                      requiresDocument: !!checked
                    }))
                  }
                />
                <Label htmlFor="requiresDocument">Requires supporting document</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={leaveTypeFormData.description || ''}
                  onChange={handleLeaveTypeFormChange}
                  placeholder="Description of this leave type"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLeaveTypeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={isEditingLeaveType ? handleUpdateLeaveType : handleCreateLeaveType}
                disabled={!leaveTypeFormData.name || leaveTypeFormData.maxDaysPerYear < 0}
                >
                  {isEditingLeaveType ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    
          {/* Delete Leave Type Confirmation Dialog */}
          <AlertDialog open={showDeleteLeaveTypeDialog} onOpenChange={setShowDeleteLeaveTypeDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the leave type 
                  "{leaveTypeToDelete?.name}" and remove it from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteLeaveType}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
}
      export default AdminDashboard;