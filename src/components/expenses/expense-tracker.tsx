'use client'

import { useState } from 'react'
import { createExpenseAction, deleteExpenseAction } from '@/app/actions/expenses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate, formatStatusLabel } from '@/lib/utils'
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { NepaliDatePicker } from '@/components/ui/nepali-date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

export function ExpenseTracker({ caseId, financials }: { caseId: string, financials: any }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [category, setCategory] = useState('')
  const [isBillable, setIsBillable] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  async function handleAddExpense(formData: FormData) {
    setIsSubmitting(true)
    formData.append('case_id', caseId)
    formData.append('category', category)
    formData.append('expense_date', date)
    if (isBillable) formData.append('is_billable', 'on')
    
    const res = await createExpenseAction({ success: false }, formData)
    setIsSubmitting(false)
    if (res.success) {
      toast.success('Expense logged successfully')
      setOpen(false)
    } else {
      toast.error(res.error || 'Failed to log expense')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    const res = await deleteExpenseAction(id, caseId)
    if (res.success) {
      toast.success('Expense deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  const { expenses, totalExpenses, totalRevenue, profit } = financials

  return (
    <div className="space-y-6">
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <ArrowUpRight className="w-4 h-4" />
            <h4 className="text-sm font-semibold uppercase tracking-wider">Total Revenue</h4>
          </div>
          <p className="text-3xl font-extrabold text-emerald-700">{formatCurrency(totalRevenue)}</p>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <ArrowDownRight className="w-4 h-4" />
            <h4 className="text-sm font-semibold uppercase tracking-wider">Total Expenses</h4>
          </div>
          <p className="text-3xl font-extrabold text-red-700">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className={`p-5 rounded-2xl border ${profit >= 0 ? 'bg-blue-600 border-blue-700 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-900 border-slate-800 text-white'}`}>
          <div className="flex items-center gap-2 text-blue-200 mb-2">
            <Activity className="w-4 h-4" />
            <h4 className="text-sm font-semibold uppercase tracking-wider">Net Profit</h4>
          </div>
          <p className="text-3xl font-extrabold">{formatCurrency(profit)}</p>
        </div>
      </div>

      {/* Expense List Header */}
      <div className="flex justify-between items-center pt-4">
        <h3 className="text-lg font-bold">Expense Log</h3>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="rounded-full shadow-lg"><Plus className="w-4 h-4 mr-2" /> Log Expense</Button>} />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log New Expense</DialogTitle>
            </DialogHeader>
            <form action={handleAddExpense} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select required value={category} onValueChange={(val) => setCategory(val || '')} name="category">
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="stamp_duty">Stamp Duty</SelectItem>
                    <SelectItem value="printing">Printing</SelectItem>
                    <SelectItem value="court_fee">Court Fee</SelectItem>
                    <SelectItem value="filing_fee">Filing Fee</SelectItem>
                    <SelectItem value="photocopy">Photocopy</SelectItem>
                    <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount (NPR)</Label>
                <Input required type="number" step="0.01" min="0" name="amount" placeholder="5000" />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <NepaliDatePicker required value={date} onChange={(val) => setDate(val)} />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" placeholder="e.g. Taxi to Supreme Court" />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <Label>Billable to Client</Label>
                  <p className="text-xs text-muted-foreground">Add this to the next invoice</p>
                </div>
                <Switch checked={isBillable} onCheckedChange={setIsBillable} />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? 'Logging...' : 'Save Expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No expenses logged for this case yet.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Logged By</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-slate-500">
                      <Calendar className="w-3.5 h-3.5 mr-2" />
                      {formatDate(exp.expense_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {formatStatusLabel(exp.category)}
                    </span>
                    {exp.is_billable && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded border border-blue-200 text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                        Billable
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={exp.description}>
                    {exp.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {exp.profiles?.full_name}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
