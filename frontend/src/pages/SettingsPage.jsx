import { LampDemo } from '../components/ui/lamp'
import { Button } from '../components/ui/button'
import { cn } from "../lib/utils";

export default function SettingsPage() {
  return (
    <div className={cn("bg-red-100")}>
      <div className="min-h-screen w-full flex items-center justify-center">
        <LampDemo>click me</LampDemo> 
      </div>
    </div>
  )
}


