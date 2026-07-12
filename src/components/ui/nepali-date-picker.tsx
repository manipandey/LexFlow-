"use client"

import * as React from "react"
import { useMemo, useState, useEffect } from "react"
import NepaliDate from "nepali-date-converter"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface NepaliDatePickerProps {
  id?: string
  name?: string
  value?: string // A.D. date string (YYYY-MM-DD)
  onChange?: (gregorianDate: string) => void
  required?: boolean
  className?: string
  placeholder?: string
}

const NEPALI_MONTHS_NP = [
  "बैशाख", "जेठ", "असार", "श्रावण", "भाद्र", "आश्विन",
  "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुण", "चैत्र"
]

const WEEKDAYS_NP = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"]

const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"]

function toNepaliDigits(num: number | string): string {
  return String(num)
    .split("")
    .map((char) => {
      const digit = parseInt(char, 10)
      return isNaN(digit) ? char : nepaliDigits[digit]
    })
    .join("")
}

function getDaysInNepaliMonth(year: number, month: number): number {
  for (let d = 32; d >= 28; d--) {
    try {
      const nd = new NepaliDate(year, month, d)
      if (nd.getMonth() === month) {
        return d
      }
    } catch (e) {
      // Ignore conversion overflows
    }
  }
  return 30
}

export function NepaliDatePicker({
  id,
  name,
  value,
  onChange,
  required,
  className,
  placeholder = "मिति छान्नुहोस् (Select Date)"
}: NepaliDatePickerProps) {
  const [selectedADDate, setSelectedADDate] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)

  // Sync with prop value
  useEffect(() => {
    if (value) {
      // Ensure it is a valid date string
      try {
        const d = new Date(value)
        if (!isNaN(d.getTime())) {
          setSelectedADDate(value.split("T")[0])
        } else {
          setSelectedADDate("")
        }
      } catch (e) {
        setSelectedADDate("")
      }
    } else {
      setSelectedADDate("")
    }
  }, [value])

  const selectedNepaliDate = useMemo(() => {
    if (!selectedADDate) return null
    try {
      return new NepaliDate(new Date(selectedADDate))
    } catch (e) {
      return null
    }
  }, [selectedADDate])

  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedNepaliDate ? selectedNepaliDate.getYear() : new NepaliDate().getYear()
  })
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedNepaliDate ? selectedNepaliDate.getMonth() : new NepaliDate().getMonth()
  })

  // Sync calendar view when date is selected
  useEffect(() => {
    if (selectedNepaliDate) {
      setViewYear(selectedNepaliDate.getYear())
      setViewMonth(selectedNepaliDate.getMonth())
    }
  }, [selectedNepaliDate])

  const daysInMonth = useMemo(() => getDaysInNepaliMonth(viewYear, viewMonth), [viewYear, viewMonth])
  
  const firstDayOfWeek = useMemo(() => {
    try {
      return new NepaliDate(viewYear, viewMonth, 1).getDay()
    } catch (e) {
      return 0
    }
  }, [viewYear, viewMonth])

  const dayCells = useMemo(() => {
    const arr: (number | null)[] = Array(firstDayOfWeek).fill(null)
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(i)
    }
    return arr
  }, [daysInMonth, firstDayOfWeek])

  const yearsRange = useMemo(() => {
    const range: number[] = []
    for (let y = 2000; y <= 2095; y++) {
      range.push(y)
    }
    return range
  }, [])

  const handleSelectDay = (day: number) => {
    const nd = new NepaliDate(viewYear, viewMonth, day)
    const ad = nd.getAD()
    const gregorianStr = `${ad.year}-${String(ad.month + 1).padStart(2, "0")}-${String(ad.date).padStart(2, "0")}`
    
    setSelectedADDate(gregorianStr)
    if (onChange) {
      onChange(gregorianStr)
    }
    setIsOpen(false)
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => Math.max(2000, prev - 1))
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => Math.min(2095, prev + 1))
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  const handleSetToday = () => {
    const today = new NepaliDate()
    const ad = today.getAD()
    const gregorianStr = `${ad.year}-${String(ad.month + 1).padStart(2, "0")}-${String(ad.date).padStart(2, "0")}`
    setSelectedADDate(gregorianStr)
    if (onChange) {
      onChange(gregorianStr)
    }
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedADDate("")
    if (onChange) {
      onChange("")
    }
    setIsOpen(false)
  }

  const todayND = useMemo(() => new NepaliDate(), [])

  const isTodayCell = (day: number) => {
    return (
      todayND.getYear() === viewYear &&
      todayND.getMonth() === viewMonth &&
      todayND.getDate() === day
    )
  }

  const isSelectedCell = (day: number) => {
    if (!selectedNepaliDate) return false
    return (
      selectedNepaliDate.getYear() === viewYear &&
      selectedNepaliDate.getMonth() === viewMonth &&
      selectedNepaliDate.getDate() === day
    )
  }

  const formattedInputText = useMemo(() => {
    if (!selectedNepaliDate) return ""
    // Format as: YYYY-MM-DD (e.g. २०८३-०३-२८)
    const yStr = String(selectedNepaliDate.getYear())
    const mStr = String(selectedNepaliDate.getMonth() + 1).padStart(2, "0")
    const dStr = String(selectedNepaliDate.getDate()).padStart(2, "0")
    return toNepaliDigits(`${yStr}-${mStr}-${dStr}`)
  }, [selectedNepaliDate])

  return (
    <div className="relative w-full">
      {/* Hidden field for form posts */}
      <input type="hidden" name={name} id={id} value={selectedADDate} required={required} />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                !selectedADDate && "text-muted-foreground",
                className
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" />
                {selectedADDate ? (
                  <span className="font-medium text-foreground">
                    {formattedInputText} <span className="text-[11px] text-muted-foreground font-normal">({selectedADDate})</span>
                  </span>
                ) : (
                  <span>{placeholder}</span>
                )}
              </span>
              {selectedADDate && !required && (
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          }
        />

        <PopoverContent className="w-80 p-4 border rounded-xl bg-popover shadow-xl isolate z-50">
          {/* Calendar Header */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Year Select */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-transparent border-none py-1 px-2 font-bold text-sm rounded-md hover:bg-muted cursor-pointer focus:outline-none"
              >
                {yearsRange.map((y) => (
                  <option key={y} value={y} className="bg-popover text-foreground text-sm">
                    {toNepaliDigits(y)}
                  </option>
                ))}
              </select>

              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-transparent border-none py-1 px-2 font-bold text-sm rounded-md hover:bg-muted cursor-pointer focus:outline-none"
              >
                {NEPALI_MONTHS_NP.map((m, idx) => (
                  <option key={idx} value={idx} className="bg-popover text-foreground text-sm">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-xs font-semibold text-muted-foreground">
            {WEEKDAYS_NP.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />
              }

              const selected = isSelectedCell(day)
              const today = isTodayCell(day)

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-8 w-8 text-xs font-medium rounded-md flex items-center justify-center transition-all hover:bg-accent hover:text-accent-foreground cursor-pointer active:scale-95",
                    today && "ring-1 ring-primary text-primary font-bold",
                    selected && "bg-primary text-primary-foreground font-semibold hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {toNepaliDigits(day)}
                </button>
              )
            })}
          </div>

          {/* Popover Footer */}
          <div className="flex items-center justify-between border-t pt-3 mt-3 text-xs">
            <span className="text-[10px] text-muted-foreground font-mono">
              {selectedADDate ? `A.D.: ${selectedADDate}` : "Select a date"}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetToday}
                className="px-2.5 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md font-medium transition-colors cursor-pointer"
              >
                आज (Today)
              </button>
              {!required && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-1 text-xs hover:bg-muted text-muted-foreground hover:text-foreground rounded-md font-medium transition-colors cursor-pointer"
                >
                  हटाउनुहोस् (Clear)
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
