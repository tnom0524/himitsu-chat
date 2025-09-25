"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ThumbsUp, Star, CheckCircle } from "lucide-react"
import type { StampType, Stamp } from "@/lib/types"

export const STAMP_TYPES: Array<{ icon: typeof Heart; label: StampType; color: string }> = [
  { icon: Heart, label: "いいね", color: "text-red-500" },
  { icon: ThumbsUp, label: "わかった", color: "text-blue-500" },
  { icon: Star, label: "すごい", color: "text-yellow-500" },
  { icon: CheckCircle, label: "理解", color: "text-green-500" },
]

interface StampSelectorProps {
  messageId: string
  stamps?: Stamp[]
  onStamp: (messageId: string, stampType: StampType) => void
  disabled?: boolean
}

export function StampSelector({ messageId, stamps = [], onStamp, disabled = false }: StampSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STAMP_TYPES.map((stamp) => {
        const StampIcon = stamp.icon
        const stampCount = stamps.find((s) => s.type === stamp.label)?.count || 0

        return (
          <Button
            key={stamp.label}
            variant="outline"
            size="sm"
            className="h-8 px-3 gap-1.5 bg-transparent hover:bg-muted/50 transition-colors"
            onClick={() => !disabled && onStamp(messageId, stamp.label)}
            disabled={disabled}
          >
            <StampIcon className={`h-3 w-3 ${stamp.color}`} />
            <span className="text-xs">{stamp.label}</span>
            {stampCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-xs">
                {stampCount}
              </Badge>
            )}
          </Button>
        )
      })}
    </div>
  )
}
