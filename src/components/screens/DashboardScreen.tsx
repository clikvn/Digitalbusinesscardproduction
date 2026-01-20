import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Loader2, Search, User, Mail, Phone, Briefcase, Calendar, ExternalLink } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface UserInfo {
  user_id: string;
  user_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: api.admin.getAllUsers,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users || !searchQuery.trim()) return users || [];
    
    const query = searchQuery.toLowerCase().trim();
    return users.filter((user: UserInfo) => 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.user_code?.toLowerCase().includes(query) ||
      user.company_name?.toLowerCase().includes(query) ||
      user.title?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
        <Card className="w-full max-w-6xl">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading users...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#e9e6dc] p-4">
        <Card className="w-full max-w-6xl">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">Error loading users</p>
              <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#e9e6dc] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6" />
                  Users Dashboard
                </CardTitle>
                <CardDescription className="mt-2">
                  View all registered users and their information
                  {filteredUsers && (
                    <span className="ml-2 font-medium">
                      ({filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'})
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
              >
                Back to Auth
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, user code, company, or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Users Table */}
            {filteredUsers && filteredUsers.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: UserInfo) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-mono text-sm">
                          {user.user_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.email ? (
                              <>
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.phone ? (
                              <>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{user.phone}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.title ? (
                              <>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span>{user.title}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.company_name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(user.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(user.updated_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/${user.user_code}`)}
                            className="gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? (
                  <>
                    <p className="font-medium">No users found matching "{searchQuery}"</p>
                    <p className="text-sm mt-2">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No users found</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
