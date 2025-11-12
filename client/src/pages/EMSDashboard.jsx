import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Bell, Calendar, Mail, Send, Activity, CheckCircle, Clock, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { useSocket } from "../context/socket-context";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function EMSDashboard() {
  const [stats, setStats] = useState({
    totalScheduled: 0,
    sentToday: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState('Active');
  const [lastActivity, setLastActivity] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    subject: '',
    message: '',
    scheduleTime: '',
    templateType: 'custom'
  });
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const socketContext = useSocket();
  const socket = socketContext?.socket;
  const connected = socketContext?.connected;

  useEffect(() => {
    fetchStats();
    fetchScheduledEmails();
    
    // Auto-refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchScheduledEmails();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket || !connected) {
      setRealtimeStatus('Connecting...');
      return;
    }

    setRealtimeStatus('Active');

    // Listen for real-time EMS events
    const handleEmailsProcessed = (data) => {
      setLastActivity({ type: 'processed', count: data.count, timestamp: data.timestamp });
      fetchStats();
    };

    const handleRemindersSent = (data) => {
      setLastActivity({ type: 'reminders', count: data.count, timestamp: data.timestamp });
      fetchStats();
    };

    socket.on('ems:emails-processed', handleEmailsProcessed);
    socket.on('ems:reminders-sent', handleRemindersSent);

    return () => {
      socket.off('ems:emails-processed', handleEmailsProcessed);
      socket.off('ems:reminders-sent', handleRemindersSent);
    };
  }, [socket, connected]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/ems/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching EMS stats:', error);
    }
  };

  const fetchScheduledEmails = async () => {
    try {
      const response = await api.get('/ems/scheduled-emails?limit=10');
      if (response?.success) {
        setScheduledEmails(response.scheduledEmails || response.data?.scheduledEmails || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
      setScheduledEmails([]);
    }
  };

  const handleScheduleEmail = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await api.post('/ems/send-custom-email', {
        recipients: ['all'],
        subject: scheduleForm.subject,
        htmlBody: `<p>${scheduleForm.message}</p>`,
        scheduleTime: scheduleForm.scheduleTime
      });

      if (response.success) {
        setSuccess('Email scheduled successfully!');
        setScheduleDialogOpen(false);
        setScheduleForm({ subject: '', message: '', scheduleTime: '', templateType: 'custom' });
        fetchScheduledEmails();
        fetchStats();
      }
    } catch (error) {
      setError(error.message || 'Failed to schedule email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTaskReminders = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await api.post('/ems/send-task-reminders', {
        reminderType: "due_soon"
      });

      if (response.success) {
        setSuccess("Task reminders sent successfully!");
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      setError(error.message || "Failed to send task reminders");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EMS Dashboard</h1>
          <p className="text-muted-foreground">
            Manage automated email notifications and communications
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className={`h-3 w-3 ${connected ? 'text-green-500 animate-pulse' : 'text-yellow-500'}`} />
              Real-time Automation: {connected ? realtimeStatus : 'Offline'}
            </Badge>
            {lastActivity && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Last: {lastActivity.type === 'processed' ? 'Processed' : 'Reminders'} {lastActivity.count} emails
              </Badge>
            )}
          </div>
        </div>
        <Button
          onClick={handleSendTaskReminders}
          disabled={loading}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4 mr-2" />
          Send Task Reminders
        </Button>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
          <Bell className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
          <Bell className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Emails</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScheduled}</div>
            <p className="text-xs text-muted-foreground">
              Total emails scheduled for delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sentToday}</div>
            <p className="text-xs text-muted-foreground">
              Emails sent in the last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Emails queued for sending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Log */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500 animate-pulse" />
            Real-time Automation Status
          </CardTitle>
          <CardDescription>
            Live monitoring of automated email operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">Scheduled Email Processing</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Runs every 5 minutes</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Daily Task Reminders</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Runs every hour</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
            {lastActivity && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <p className="text-sm font-medium mb-2">Last Activity</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {lastActivity.type === 'processed' ? 'Processed' : 'Sent reminders for'} {lastActivity.count} emails
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lastActivity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                    Success
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Templates Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Click on a template to send emails to relevant employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start hover:bg-primary/5 hover:border-primary transition-all"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    const response = await api.post('/ems/send-task-reminders', { reminderType: 'all' });
                    if (response.success) {
                      setSuccess(`Task assignment emails sent successfully!`);
                    }
                  } catch (err) {
                    setError(err.message || 'Failed to send task assignment emails');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Mail className="h-5 w-5 mb-2 text-blue-500" />
                <h4 className="font-medium mb-1 text-left">Task Assignment</h4>
                <p className="text-sm text-muted-foreground text-left">Send emails for newly assigned tasks</p>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start hover:bg-primary/5 hover:border-primary transition-all"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    const response = await api.post('/ems/send-task-reminders', { reminderType: 'due_soon' });
                    if (response.success) {
                      setSuccess(`Task reminder emails sent to ${response.summary?.successful || 0} employees!`);
                    }
                  } catch (err) {
                    setError(err.message || 'Failed to send task reminders');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Calendar className="h-5 w-5 mb-2 text-yellow-500" />
                <h4 className="font-medium mb-1 text-left">Task Reminder</h4>
                <p className="text-sm text-muted-foreground text-left">Send reminders for upcoming deadlines</p>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start hover:bg-primary/5 hover:border-primary transition-all"
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    const response = await api.post('/ems/send-overdue-alerts');
                    if (response.success) {
                      setSuccess(`Overdue alerts sent to ${response.results?.length || 0} employees!`);
                    }
                  } catch (err) {
                    setError(err.message || 'Failed to send overdue alerts');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Bell className="h-5 w-5 mb-2 text-red-500" />
                <h4 className="font-medium mb-1 text-left">Task Overdue</h4>
                <p className="text-sm text-muted-foreground text-left">Send alerts for overdue tasks</p>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Emails Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scheduled Emails</CardTitle>
              <CardDescription>
                View and manage upcoming scheduled email communications
              </CardDescription>
            </div>
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Schedule Email</DialogTitle>
                  <DialogDescription>
                    Schedule an email to be sent at a specific time
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Email subject"
                      value={scheduleForm.subject}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Email message"
                      rows={4}
                      value={scheduleForm.message}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, message: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Schedule Time</Label>
                    <Input
                      id="scheduleTime"
                      type="datetime-local"
                      value={scheduleForm.scheduleTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, scheduleTime: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleScheduleEmail}
                    disabled={loading || !scheduleForm.subject || !scheduleForm.message || !scheduleForm.scheduleTime}
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Email
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scheduledEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No scheduled emails</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledEmails.map((email) => (
                  <div key={email._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{email.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        Scheduled for: {new Date(email.scheduledTime).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recipients: {email.recipients?.length || 0}
                      </p>
                    </div>
                    <Badge variant={email.status === 'scheduled' ? 'default' : 'secondary'}>
                      {email.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}