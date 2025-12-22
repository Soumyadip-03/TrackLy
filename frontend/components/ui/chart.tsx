import type React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }

export const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const ChartTooltip = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const ChartTooltipContent = ({
  payload,
  label,
  children,
}: { payload: any; label: any; children?: React.ReactNode }) => {
  if (!payload) return null

  return (
    <div className="p-2 bg-secondary border rounded-md">
      <p className="text-sm font-medium">{label}</p>
      {payload &&
        payload.length > 0 &&
        Object.keys(payload[0].payload).map((key) => {
          if (key !== "name") {
            return (
              <p key={key} className="text-xs">
                <span className="font-bold">{key}:</span> {payload[0].payload[key]}
              </p>
            )
          }
          return null
        })}
      {children}
    </div>
  )
}

export const Chart = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
