import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface LeaveType {
  id: number;
  name: string;
  maxDaysPerYear: number;
  requiresDocument: boolean;
}

interface LeaveBalance {
  id: number;
  leaveType: string;
  availableDays: number;
}

const ApplyLeave = () => {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<string>("AM");
  const [reason, setReason] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [daysRequested, setDaysRequested] = useState(0);

  // Load leave types and balances on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leave types
        const typesResponse = await axios.get('/api/leave-types/list');
        setLeaveTypes(typesResponse.data);
        
        // Fetch leave balances
        const balancesResponse = await axios.get('/api/leave-balances/my-balances');
        setLeaveBalances(balancesResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load necessary data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate days requested when dates change
  useEffect(() => {
    if (startDate && endDate) {
      // Simple calculation (doesn't account for weekends/holidays)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include end date
      
      if (isHalfDay) {
        diffDays = 0.5;
      }
      
      setDaysRequested(diffDays);
    } else {
      setDaysRequested(0);
    }
  }, [startDate, endDate, isHalfDay]);

  // Update document requirement when leave type changes
  useEffect(() => {
    if (selectedLeaveType) {
      const selectedType = leaveTypes.find(lt => lt.id.toString() === selectedLeaveType);
      setShowDocumentUpload(selectedType?.requiresDocument || false);
    }
  }, [selectedLeaveType, leaveTypes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Selected leave type before submit:", selectedLeaveType);
    console.log("Leave types:", leaveTypes);
    
    if (!selectedLeaveType || !startDate || (!endDate && !isHalfDay)) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (showDocumentUpload && !document) {
      setError("Please upload the required supporting document");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create form data if there's a document
      let formData;
      let requestData;
      
      // Get the leave type object from the selected ID
      const selectedTypeObj = leaveTypes.find(lt => lt.id.toString() === selectedLeaveType);
      
      if (!selectedTypeObj) {
        throw new Error("Selected leave type not found");
      }
      
      if (document) {
        formData = new FormData();
        formData.append('file', document);
        
        // Upload document first
        const documentResponse = await axios.post('/api/documents/upload', formData);
        const documentId = documentResponse.data.id;
        
        requestData = {
          leaveTypeName: selectedTypeObj.name, // Use the name directly
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: isHalfDay ? format(startDate, 'yyyy-MM-dd') : format(endDate!, 'yyyy-MM-dd'),
          halfDay: isHalfDay,
          halfDayPeriod: isHalfDay ? halfDayPeriod : null,
          reason,
          documentId
        };
      } else {
        requestData = {
          leaveTypeId: parseInt(selectedLeaveType),
          leaveTypeName: selectedTypeObj.name, // Add the name here as well
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: isHalfDay ? format(startDate, 'yyyy-MM-dd') : format(endDate!, 'yyyy-MM-dd'),
          halfDay: isHalfDay,
          halfDayPeriod: isHalfDay ? halfDayPeriod : null,
          reason
        };
      }
      
      // Submit leave request
      await axios.post('/api/leaves', requestData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: unknown) {
      console.error("Error submitting leave request:", error);
      
      // Fix: Type guard to check if error is an object with response property 
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          typeof error.response.data === 'object' && error.response.data && 'message' in error.response.data) {
        setError(error.response.data.message as string || "Failed to submit leave request. Please try again.");
      } else {
        setError("Failed to submit leave request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailableDays = (leaveTypeId: string) => {
    if (!leaveTypeId) return 0;
    
    const typeObj = leaveTypes.find(lt => lt.id.toString() === leaveTypeId);
    if (!typeObj) return 0;
    
    const balanceObj = leaveBalances.find(lb => lb.leaveType === typeObj.name);
    return balanceObj?.availableDays || 0;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Apply for Leave</CardTitle>
            <CardDescription>Fill out this form to request time off</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  Leave request submitted successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                
                {/* Leave Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type <span className="text-red-500">*</span></Label>
                  <Select 
                    value={selectedLeaveType} 
                    onValueChange={setSelectedLeaveType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map(type => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedLeaveType && (
                    <div className="text-sm mt-1">
                      Available days:{" "}
                      <Badge variant="outline">
                        {getAvailableDays(selectedLeaveType)} days
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Half Day Option */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="halfDay" 
                    checked={isHalfDay}
                    onCheckedChange={(checked) => {
                      setIsHalfDay(checked === true);
                      if (checked) {
                        setEndDate(undefined);
                      }
                    }}
                  />
                  <Label htmlFor="halfDay">Half Day Leave</Label>
                </div>
                
                {isHalfDay && (
                  <div className="space-y-2">
                    <Label htmlFor="halfDayPeriod">Time Period</Label>
                    <Select 
                      value={halfDayPeriod} 
                      onValueChange={setHalfDayPeriod}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">Morning (AM)</SelectItem>
                        <SelectItem value="PM">Afternoon (PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-gray-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => 
                            date < new Date() || 
                            date.getDay() === 0 ||
                            date.getDay() === 6
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {!isHalfDay && (
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-gray-400"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => 
                              date < (startDate || new Date()) || 
                              date.getDay() === 0 ||
                              date.getDay() === 6
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                
                {/* Summary of days being requested */}
                {daysRequested > 0 && (
                  <div className="text-sm bg-blue-50 p-3 rounded-md">
                    <span className="block font-medium">Leave Summary</span>
                    <span className="block mt-1">
                      Requesting {daysRequested} {daysRequested === 1 || daysRequested === 0.5 ? 'day' : 'days'} of leave
                    </span>
                    {selectedLeaveType && daysRequested > getAvailableDays(selectedLeaveType) && (
                      <span className="block mt-1 text-red-600">
                        Warning: You are requesting more days than you have available
                      </span>
                    )}
                  </div>
                )}
                
                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason {showDocumentUpload && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe the reason for your leave request"
                    rows={3}
                    required={showDocumentUpload}
                  />
                </div>
                
                {/* Document Upload */}
                {showDocumentUpload && (
                  <div className="space-y-2">
                    <Label htmlFor="document">
                      Supporting Document <span className="text-red-500">*</span>
                    </Label>
                    <div className="border-2 border-dashed rounded-md p-6 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Input
                          id="document"
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Label
                          htmlFor="document"
                          className="cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Choose file
                        </Label>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        PDF, DOC, DOCX, JPG, PNG up to 5MB
                      </p>
                      {document && (
                        <p className="mt-2 text-sm text-gray-700">
                          Selected: {document.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : "Submit Request"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplyLeave;