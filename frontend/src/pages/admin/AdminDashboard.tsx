import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/services/adminService';
import { Users, BookOpen, Upload, Edit, Key, Power, Search, X, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Create User Form
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    department: '',
  });

  // Create Course Form
  const [courseData, setCourseData] = useState({
    courseCode: '',
    courseName: '',
    semester: '',
    department: '',
    professorEmail: '',
  });
  const [courseStudentsFile, setCourseStudentsFile] = useState<File | null>(null);

  // Course Management
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [enrollEmails, setEnrollEmails] = useState('');
  const [enrollCSVFile, setEnrollCSVFile] = useState<File | null>(null);
  const [enrollMethod, setEnrollMethod] = useState<'email' | 'csv'>('email');
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  // Edit User Form
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
  });

  // Load users
  useEffect(() => {
    loadUsers();
    loadCourses();
  }, [searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter !== 'all') params.role = roleFilter;
      const data = await adminService.getUsers(params);
      setUsers(data);
    } catch (error: any) {
      toast({
        title: 'Error loading users',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.createUser(userData);
      toast({ title: 'User created successfully!' });
      setUserData({ name: '', email: '', role: 'student', password: '', department: '' });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error creating user',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const result = await adminService.bulkCreateUsers(formData);
      toast({
        title: 'Users uploaded successfully!',
        description: `Created: ${result.created}, Skipped: ${result.skipped}`,
      });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error uploading CSV',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await adminService.getCourses();
      setCourses(data);
    } catch (error: any) {
      toast({
        title: 'Error loading courses',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await adminService.createCourse(courseData, courseStudentsFile);
      let message = 'Course created successfully!';
      if (result.enrollment) {
        message += ` Enrolled: ${result.enrollment.enrolled} students (Found: ${result.enrollment.found}/${result.enrollment.total})`;
        if (result.enrollment.notFound?.length > 0) {
          message += `. ${result.enrollment.notFound.length} emails not found.`;
        }
      }
      toast({ 
        title: 'Course created successfully!',
        description: result.enrollment ? `Enrolled ${result.enrollment.enrolled} students` : undefined,
      });
      setCourseData({ courseCode: '', courseName: '', semester: '', department: '', professorEmail: '' });
      setCourseStudentsFile(null);
      loadCourses();
    } catch (error: any) {
      toast({
        title: 'Error creating course',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollByEmail = async () => {
    if (!selectedCourse || !enrollEmails.trim()) return;

    const emails = enrollEmails
      .split('\n')
      .map((e) => e.trim())
      .filter((e) => e);

    if (emails.length === 0) {
      toast({
        title: 'No emails provided',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await adminService.enrollStudentsByEmail(selectedCourse, emails);
      toast({
        title: 'Students enrolled successfully!',
        description: `Enrolled: ${result.enrolled}, Found: ${result.found}, Total: ${result.total}`,
      });
      setEnrollEmails('');
      setShowEnrollDialog(false);
      loadCourses();
    } catch (error: any) {
      toast({
        title: 'Error enrolling students',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollByCSV = async () => {
    if (!selectedCourse || !enrollCSVFile) return;

    setLoading(true);
    try {
      const result = await adminService.enrollStudentsFromCSV(selectedCourse, enrollCSVFile);
      toast({
        title: 'Enrollment completed!',
        description: `Enrolled: ${result.enrolled}, Found: ${result.found}, Total: ${result.total}${
          result.notFound?.length > 0 ? `, Not found: ${result.notFound.length}` : ''
        }`,
      });
      setEnrollCSVFile(null);
      setShowEnrollDialog(false);
      loadCourses();
    } catch (error: any) {
      toast({
        title: 'Error enrolling students',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      await adminService.updateUser(editingUser._id, editUserData);
      toast({ title: 'User updated successfully!' });
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error updating user',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    setLoading(true);
    try {
      await adminService.resetPassword(resetPasswordUser._id, newPassword);
      toast({ title: 'Password reset successfully!' });
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Error resetting password',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    setLoading(true);
    try {
      await adminService.toggleUserStatus(user._id);
      toast({ title: `User ${user.isActive ? 'deactivated' : 'activated'} successfully!` });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error updating user status',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and courses</p>
        </div>

        <Tabs defaultValue="manage-users" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
            <TabsTrigger value="create-user">Create User</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            <TabsTrigger value="courses">Create Course</TabsTrigger>
            <TabsTrigger value="manage-courses">Manage Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="manage-users">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>{user.department || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setResetPasswordUser(user)}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleStatus(user)}
                                  disabled={user.role === 'admin'}
                                >
                                  <Power className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-user">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Create User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={userData.role}
                        onValueChange={(value) => setUserData({ ...userData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="professor">Professor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        required
                      />
                    </div>

                    {userData.role === 'professor' && (
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={userData.department}
                          onChange={(e) => setUserData({ ...userData, department: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Bulk Upload Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with columns: name, email, department, role, password (optional)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    If password is not provided, a random password will be generated.
                  </p>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Create Course
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseCode">Course Code</Label>
                      <Input
                        id="courseCode"
                        value={courseData.courseCode}
                        onChange={(e) => setCourseData({ ...courseData, courseCode: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="courseName">Course Name</Label>
                      <Input
                        id="courseName"
                        value={courseData.courseName}
                        onChange={(e) => setCourseData({ ...courseData, courseName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Input
                        id="semester"
                        value={courseData.semester}
                        onChange={(e) => setCourseData({ ...courseData, semester: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="courseDepartment">Department</Label>
                      <Input
                        id="courseDepartment"
                        value={courseData.department}
                        onChange={(e) => setCourseData({ ...courseData, department: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="professorEmail">Professor Email</Label>
                      <Input
                        id="professorEmail"
                        type="email"
                        value={courseData.professorEmail}
                        onChange={(e) => setCourseData({ ...courseData, professorEmail: e.target.value })}
                        placeholder="professor@dept.vnit.ac.in"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the professor's email address
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="studentsFile">Enroll Students (Optional)</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Upload a CSV file with student emails. CSV should have a column named 'email' or 'studentEmail'.
                      </p>
                      {courseStudentsFile ? (
                        <div className="flex items-center gap-2 p-3 border rounded-lg">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm flex-1">{courseStudentsFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCourseStudentsFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Input
                          id="studentsFile"
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setCourseStudentsFile(file);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Course'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage-courses">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Loading courses...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No courses found</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course Code</TableHead>
                            <TableHead>Course Name</TableHead>
                            <TableHead>Professor</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courses.map((course: any) => (
                            <TableRow key={course._id}>
                              <TableCell className="font-medium">{course.courseCode}</TableCell>
                              <TableCell>{course.courseName}</TableCell>
                              <TableCell>
                                {course.professorId ? (
                                  typeof course.professorId === 'object' ? (
                                    course.professorId.email || course.professorId.name
                                  ) : (
                                    'N/A'
                                  )
                                ) : (
                                  'Not assigned'
                                )}
                              </TableCell>
                              <TableCell>{course.department}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{course.studentIds?.length || 0}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCourse(course._id);
                                    setShowEnrollDialog(true);
                                  }}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Enroll Students
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editingUser !== null} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editUserData.role}
                onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={editUserData.department}
                onChange={(e) => setEditUserData({ ...editUserData, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordUser !== null} onOpenChange={() => setResetPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {resetPasswordUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResetPasswordUser(null);
              setNewPassword('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={loading || !newPassword}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Students Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enroll Students</DialogTitle>
            <DialogDescription>
              Enroll students to the selected course using email list or CSV file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Enrollment Method</Label>
              <Select
                value={enrollMethod}
                onValueChange={(value: 'email' | 'csv') => {
                  setEnrollMethod(value);
                  if (value === 'csv') {
                    setEnrollEmails('');
                  } else {
                    setEnrollCSVFile(null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email List</SelectItem>
                  <SelectItem value="csv">CSV File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {enrollMethod === 'email' ? (
              <div className="space-y-2">
                <Label>Student Emails (one per line)</Label>
                <Textarea
                  value={enrollEmails}
                  onChange={(e) => setEnrollEmails(e.target.value)}
                  placeholder="student1@students.vnit.ac.in&#10;student2@students.vnit.ac.in&#10;student3@students.vnit.ac.in"
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one email address per line
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>CSV File</Label>
                {enrollCSVFile ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{enrollCSVFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEnrollCSVFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setEnrollCSVFile(file);
                    }}
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  CSV should have a column named 'email' or 'studentEmail' with student email addresses
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEnrollDialog(false);
              setEnrollEmails('');
              setEnrollCSVFile(null);
              setEnrollMethod('email');
              setSelectedCourse(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={enrollMethod === 'csv' ? handleEnrollByCSV : handleEnrollByEmail}
              disabled={loading || (enrollMethod === 'email' && !enrollEmails.trim()) || (enrollMethod === 'csv' && !enrollCSVFile)}
            >
              {loading ? 'Enrolling...' : 'Enroll Students'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
