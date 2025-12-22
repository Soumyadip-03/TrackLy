'use client';

import { Shield } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  withTooltip?: boolean;
  className?: string;
}

export function AdminBadge({ size = 'md', withTooltip = true, className = '' }: AdminBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs py-0 px-1.5',
    md: 'text-xs py-0.5 px-2',
    lg: 'text-sm py-1 px-2.5'
  };
  
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };
  
  const badge = (
    <Badge 
      variant="outline" 
      className={`bg-purple-100 text-purple-800 border-purple-300 font-semibold flex items-center gap-1 ${sizeClasses[size]} ${className}`}
    >
      <Shield size={iconSizes[size]} className="text-purple-600" />
      ADMIN
    </Badge>
  );
  
  if (!withTooltip) return badge;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>Administrator account with full system access</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
