"use client"

import { useState } from "react"
import { 
  CalendarIcon, 
  Check, 
  Clock, 
  Download, 
  MoreHorizontal, 
  PenLine, 
  Plus, 
  Search, 
  Trash, 
  Users,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Calendar
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader, MetricCard, DataPanel } from "@/components/ui/professional";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComp } from "@/components/ui/calendar"

const staffMembers = [
  {
    id: 1,
    name: "Rebecca Moore",
    position: "Senior Sales Associate",
    email: "rebecca.moore@example.com",
    phone: "(555) 123-4567",
    status: "active",
    performance: "above-target",
    initials: "RM",
    schedule: [
      { day: "Monday", shift: "9:00 AM - 5:00 PM" },
      { day: "Tuesday", shift: "9:00 AM - 5:00 PM" },
      { day: "Wednesday", shift: "9:00 AM - 5:00 PM" },
      { day: "Thursday", shift: "OFF" },
      { day: "Friday", shift: "9:00 AM - 5:00 PM" },
      { day: "Saturday", shift: "10:00 AM - 6:00 PM" },
      { day: "Sunday", shift: "OFF" },
    ],
  },
  {
    id: 2,
    name: "James Wilson",
    position: "Sales Associate",
    email: "james.wilson@example.com",
    phone: "(555) 234-5678",
    status: "active",
    performance: "on-target",
    initials: "JW",
    schedule: [
      { day: "Monday", shift: "OFF" },
      { day: "Tuesday", shift: "9:00 AM - 5:00 PM" },
      { day: "Wednesday", shift: "9:00 AM - 5:00 PM" },
      { day: "Thursday", shift: "9:00 AM - 5:00 PM" },
      { day: "Friday", shift: "9:00 AM - 5:00 PM" },
      { day: "Saturday", shift: "10:00 AM - 6:00 PM" },
      { day: "Sunday", shift: "OFF" },
    ],
  },
  {
    id: 3,
    name: "Sarah Johnson",
    position: "Sales Associate",
    email: "sarah.johnson@example.com",
    phone: "(555) 345-6789",
    status: "active",
    performance: "on-target",
    initials: "SJ",
    schedule: [
      { day: "Monday", shift: "9:00 AM - 5:00 PM" },
      { day: "Tuesday", shift: "9:00 AM - 5:00 PM" },
      { day: "Wednesday", shift: "OFF" },
      { day: "Thursday", shift: "OFF" },
      { day: "Friday", shift: "1:00 PM - 9:00 PM" },
      { day: "Saturday", shift: "10:00 AM - 6:00 PM" },
      { day: "Sunday", shift: "12:00 PM - 5:00 PM" },
    ],
  },
  {
    id: 4,
    name: "David Martinez",
    position: "Junior Sales Associate",
    email: "david.martinez@example.com",
    phone: "(555) 456-7890",
    status: "on-leave",
    performance: "below-target",
    initials: "DM",
    schedule: [
      { day: "Monday", shift: "OFF" },
      { day: "Tuesday", shift: "OFF" },
      { day: "Wednesday", shift: "OFF" },
      { day: "Thursday", shift: "OFF" },
      { day: "Friday", shift: "OFF" },
      { day: "Saturday", shift: "OFF" },
      { day: "Sunday", shift: "OFF" },
    ],
  },
  {
    id: 5,
    name: "Michael Chen",
    position: "Inventory Specialist",
    email: "michael.chen@example.com",
    phone: "(555) 567-8901",
    status: "active",
    performance: "on-target",
    initials: "MC",
    schedule: [
      { day: "Monday", shift: "8:00 AM - 4:00 PM" },
      { day: "Tuesday", shift: "8:00 AM - 4:00 PM" },
      { day: "Wednesday", shift: "8:00 AM - 4:00 PM" },
      { day: "Thursday", shift: "8:00 AM - 4:00 PM" },
      { day: "Friday", shift: "8:00 AM - 4:00 PM" },
      { day: "Saturday", shift: "OFF" },
      { day: "Sunday", shift: "OFF" },
    ],
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function StaffManagement() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStaff = staffMembers.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <PageHeader
        title="Staff Force"
        description="Global talent management, scheduling, and performance auditing system."
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[32px] border-brand-primary/5 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-brand-primary uppercase tracking-tight">Recruit New Talent</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Onboard a new associate to the organizational grid.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Identity</label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-brand-primary/5 focus:ring-brand-primary" placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Core Position</label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-brand-primary/5 focus:ring-brand-primary" placeholder="Designation" />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full h-12 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest">
                    Confirm Recruitment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="h-10 px-4 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50">
              <Download className="mr-2 h-3.5 w-3.5" /> Export Data
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={item}>
          <MetricCard
            label="Active Staff"
            value={staffMembers.length}
            icon={<Users className="h-5 w-5" />}
            tone="brand"
            helper="Personnel currently on roster"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="In Attendance"
            value={staffMembers.filter(s => s.status === 'active').length}
            icon={<UserCheck className="h-5 w-5" />}
            tone="emerald"
            helper="Current floor availability"
          />
        </motion.div>
        <motion.div variants={item}>
          <MetricCard
            label="Performance Ave"
            value="94%"
            icon={<TrendingUp className="h-5 w-5" />}
            tone="indigo"
            helper="Monthly efficiency rating"
          />
        </motion.div>
      </div>

      <Tabs defaultValue="staff" className="space-y-8">
        <TabsList className="flex w-full bg-white/50 backdrop-blur-xl border border-brand-primary/5 shadow-premium rounded-2xl p-1 h-auto overflow-x-auto no-scrollbar">
          {[
            { id: "staff", label: "Personnel Grid" },
            { id: "schedule", label: "Shift Planner" },
            { id: "performance", label: "Audit Reports" }
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex-1 min-w-[140px] py-2.5 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest",
                "data-[state=active]:bg-brand-primary data-[state=active]:text-brand-secondary data-[state=active]:shadow-lg data-[state=active]:shadow-brand-primary/20",
                "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="staff" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={item}>
            <DataPanel 
              title="Personnel Directory" 
              description="A centralized grid of all active and inactive associates."
              actions={
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="IDENTIFIER SEARCH..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase tracking-widest focus:ring-brand-primary placeholder:text-slate-300"
                  />
                </div>
              }
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-50 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Associate</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Core Role</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">Comm Channels</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Status</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staff) => (
                      <TableRow key={staff.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-brand-primary/5">
                              <AvatarFallback className="bg-brand-secondary text-brand-primary font-black text-xs">{staff.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-xs font-black text-slate-900 group-hover:text-brand-primary transition-colors">{staff.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest md:hidden">{staff.position}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{staff.position}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-[10px] font-bold text-slate-500">{staff.email}</div>
                          <div className="text-[9px] font-medium text-slate-400 mt-0.5">{staff.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-lg border-none px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
                              staff.status === "active"
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                : staff.status === "on-leave"
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                  : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                            )}
                          >
                            {staff.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-brand-primary hover:bg-white rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-brand-primary/5 shadow-xl">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contextual Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-[11px] font-bold py-2.5 cursor-pointer">
                                <PenLine className="mr-2 h-3.5 w-3.5" /> Modify Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[11px] font-bold py-2.5 cursor-pointer">
                                <Clock className="mr-2 h-3.5 w-3.5" /> Adjust Shift
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[11px] font-bold py-2.5 cursor-pointer">
                                <TrendingUp className="mr-2 h-3.5 w-3.5" /> Analysis
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-rose-600 text-[11px] font-black py-2.5 cursor-pointer">
                                <Trash className="mr-2 h-3.5 w-3.5" /> Terminate Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataPanel>
          </motion.div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6 focus-visible:outline-none">
          <div className="flex flex-col-reverse lg:flex-row gap-6">
            <motion.div variants={item} className="flex-1">
              <DataPanel 
                title="Shift Planner" 
                description="Coordinate personnel coverage across operational cycles."
                actions={
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 px-3 bg-slate-50 border-none rounded-lg font-bold text-[10px] uppercase tracking-widest text-slate-600">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {date ? format(date, "PPP") : "Select Cycle"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-brand-primary/5 shadow-2xl" align="end">
                      <CalendarComp mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 rounded-tl-2xl">Associate</th>
                        {dayNames.map((day) => (
                          <th key={day} className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                            {day.slice(0, 3)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((staff) => (
                        <tr key={staff.id} className="group hover:bg-slate-50/30 transition-colors">
                          <td className="px-4 py-3 border-b border-slate-50">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                <AvatarFallback className="bg-brand-secondary text-brand-primary text-[10px] font-black uppercase">{staff.initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-[11px] font-bold text-slate-700">{staff.name}</span>
                            </div>
                          </td>
                          {staff.schedule.map((s) => (
                            <td key={s.day} className="px-4 py-3 border-b border-slate-50 text-center">
                              {s.shift === "OFF" ? (
                                <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">OFF</span>
                              ) : (
                                <Badge className="bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10 border-none text-[9px] font-bold px-2 py-0.5 rounded-md">
                                  {s.shift.split(' - ')[0]}
                                </Badge>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DataPanel>
            </motion.div>

            <div className="w-full lg:w-[320px] space-y-6">
              <motion.div variants={item}>
                <DataPanel title="Orchestrator" description="Automation & Bulk Controls.">
                  <div className="space-y-2">
                    <Button className="w-full h-12 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest">
                      <Clock className="mr-2 h-3.5 w-3.5" /> Auto-Generate
                    </Button>
                    <Button variant="outline" className="w-full h-12 bg-white border-brand-primary/5 shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest text-brand-primary hover:bg-slate-50">
                      <Users className="mr-2 h-3.5 w-3.5" /> Handle Leaves
                    </Button>
                  </div>
                </DataPanel>
              </motion.div>

              <motion.div variants={item}>
                <DataPanel title="Shift Atlas" description="Color coding for grid nodes.">
                  <div className="space-y-4">
                    <LegendItem color="bg-emerald-400" label="Morning Core" />
                    <LegendItem color="bg-brand-primary" label="Mid-Day Peak" />
                    <LegendItem color="bg-indigo-400" label="Closing Team" />
                    <LegendItem color="bg-slate-200" label="Off Rotation" />
                  </div>
                </DataPanel>
              </motion.div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 focus-visible:outline-none">
          <motion.div variants={item}>
            <DataPanel title="Efficiency Audits" description="Algorithmic performance monitoring and sales delta analysis.">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-50 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Associate</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Sales (MTD)</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Throughput</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Average GTV</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Conv. Rate</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff
                      .filter((staff) => staff.position.includes("Sales"))
                      .map((staff) => {
                        const salesMTD = Math.floor(Math.random() * 10000) + 5000
                        const unitsSold = Math.floor(Math.random() * 50) + 30
                        const avgSale = salesMTD / unitsSold
                        const conversion = Math.floor(Math.random() * 20) + 30

                        return (
                          <TableRow key={staff.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-brand-primary/5">
                                  <AvatarFallback className="bg-brand-secondary text-brand-primary font-black text-xs">{staff.initials}</AvatarFallback>
                                </Avatar>
                                <span className="text-[11px] font-black text-slate-900">{staff.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-black text-brand-primary text-xs">${salesMTD.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-[11px] font-bold text-slate-600">{unitsSold} Units</TableCell>
                            <TableCell className="text-right text-[11px] font-bold text-slate-600">${avgSale.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-[11px] font-black text-slate-900">{conversion}%</TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  "rounded-lg border-none px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
                                  staff.performance === "above-target"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : staff.performance === "on-target"
                                      ? "bg-brand-primary/10 text-brand-primary"
                                      : "bg-rose-100 text-rose-700"
                                )}
                              >
                                {staff.performance.replace('-', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </DataPanel>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-3 group cursor-default">
      <div className={cn("w-3 h-3 rounded-full shadow-sm transition-transform group-hover:scale-125", color)}></div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">{label}</span>
    </div>
  );
}
