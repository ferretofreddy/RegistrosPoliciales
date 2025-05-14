import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TablePopoverProps {
  title: string;
  children: React.ReactNode;
}

export default function TablePopover({ title, children }: TablePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden visible">
          <Info className="h-4 w-4 text-primary-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{title}</h4>
            <div className="text-sm text-muted-foreground">
              {children}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}