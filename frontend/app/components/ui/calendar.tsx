import * as React from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react"
import { DayPicker, type ChevronProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex w-full flex-col gap-4",
        month_caption: "flex h-9 items-center justify-center px-8",
        caption_label: "text-sm font-semibold",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-9 border-border bg-background p-0 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-9 border-border bg-background p-0 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday:
          "text-muted-foreground flex-1 rounded-md font-medium text-[0.8rem]",
        week: "mt-2 flex w-full",
        day: cn(
          "relative h-9 w-9 p-0 text-center text-sm",
          props.mode === "range"
            ? "focus-within:relative focus-within:z-20 [&.range-start]:rounded-l-md [&.range-end]:rounded-r-md [&.range-middle]:bg-accent [&.range-start]:bg-accent [&.range-end]:bg-accent [&.range-start>button]:bg-primary [&.range-start>button]:text-primary-foreground [&.range-end>button]:bg-primary [&.range-end>button]:text-primary-foreground [&.range-middle>button]:rounded-none [&.range-middle>button]:text-foreground"
            : "focus-within:relative focus-within:z-20 [&.selected>button]:bg-primary [&.selected>button]:text-primary-foreground [&.selected>button:hover]:bg-primary [&.selected>button:hover]:text-primary-foreground"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal transition-colors"
        ),
        selected: "selected",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside:
          "outside text-muted-foreground opacity-50 [&>button]:text-muted-foreground [&>button]:opacity-50",
        disabled:
          "disabled text-muted-foreground opacity-50 [&>button]:text-muted-foreground [&>button]:opacity-50",
        range_start: "range-start",
        range_middle: "range-middle",
        range_end: "range-end",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation = "left" }: ChevronProps) => {
          const Icon =
            orientation === "right"
              ? ChevronRight
              : orientation === "down"
                ? ChevronDown
                : orientation === "up"
                  ? ChevronUp
                  : ChevronLeft

          return <Icon className={cn("size-4", className)} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
