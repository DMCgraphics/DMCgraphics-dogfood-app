"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, Eye } from "lucide-react"

interface SendEmailDialogProps {
  leadId: string
  leadEmail: string
  leadName: string | null
  children: React.ReactNode
}

interface EmailTemplate {
  id: string
  name: string
  slug: string
  category: string
  subject: string
  html_body: string
  text_body: string
  merge_fields: string[]
  description: string
}

export function SendEmailDialog({
  leadId,
  leadEmail,
  leadName,
  children,
}: SendEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [htmlBody, setHtmlBody] = useState("")
  const [textBody, setTextBody] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Fetch templates when dialog opens
  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/sales/email-templates")
      const data = await response.json()
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      })
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === "_blank") {
      // Blank email
      setSelectedTemplate("")
      setSubject("")
      setHtmlBody("")
      setTextBody("")
      return
    }

    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setHtmlBody(template.html_body)
      setTextBody(template.text_body)
    }
  }

  const handleSend = async () => {
    if (!subject.trim()) {
      toast({
        title: "Error",
        description: "Subject is required",
        variant: "destructive",
      })
      return
    }

    if (!htmlBody.trim()) {
      toast({
        title: "Error",
        description: "Email body is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/sales/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          templateId: selectedTemplate || null,
          subject,
          htmlBody,
          textBody,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      toast({
        title: "Email sent",
        description: `Email sent successfully to ${leadEmail}`,
      })

      setOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedTemplate("")
    setSubject("")
    setHtmlBody("")
    setTextBody("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email to {leadName || leadEmail}</DialogTitle>
          <DialogDescription>
            Compose and send an email. Activity will be tracked automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label htmlFor="template">Email Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Choose a template or compose from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_blank">✨ Blank Email</SelectItem>
                {templates
                  .reduce((acc, template) => {
                    if (!acc.find((t) => t.category === template.category)) {
                      acc.push({ category: template.category, templates: [] })
                    }
                    acc
                      .find((t) => t.category === template.category)
                      ?.templates.push(template)
                    return acc
                  }, [] as { category: string; templates: EmailTemplate[] }[])
                  .map((group) => (
                    <div key={group.category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground capitalize">
                        {group.category}
                      </div>
                      {group.templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
              </SelectContent>
            </Select>
            {selectedTemplate && templates.find((t) => t.id === selectedTemplate) && (
              <p className="text-xs text-muted-foreground">
                {templates.find((t) => t.id === selectedTemplate)?.description}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              required
            />
            <p className="text-xs text-muted-foreground">
              Use merge fields like {"{{"}{"{"}lead_name{"}"}{"}"}} or {"{{"}{"{"}dog_name{"}"}
              {"}"}
            </p>
          </div>

          {/* Body Editor with Tabs */}
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              {/* HTML Body */}
              <div className="space-y-2">
                <Label htmlFor="html-body">
                  HTML Body <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="html-body"
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  placeholder="<p>Hi {{lead_name}},</p><p>Your email content here...</p>"
                  className="min-h-[300px] font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use HTML for formatting. Available merge fields: lead_name, dog_name,
                  dog_breed, dog_weight, rep_name, rep_email
                </p>
              </div>

              {/* Plain Text Body */}
              <div className="space-y-2">
                <Label htmlFor="text-body">Plain Text Body (Optional)</Label>
                <Textarea
                  id="text-body"
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  placeholder="Plain text version (auto-generated if left empty)"
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  Plain text fallback for email clients that don't support HTML
                </p>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="border rounded-lg p-6 min-h-[400px] bg-white">
                <div className="mb-4 pb-4 border-b">
                  <div className="text-xs text-muted-foreground mb-1">To:</div>
                  <div className="text-sm">{leadEmail}</div>
                </div>
                <div className="mb-4 pb-4 border-b">
                  <div className="text-xs text-muted-foreground mb-1">Subject:</div>
                  <div className="font-semibold">{subject || "(No subject)"}</div>
                </div>
                <div dangerouslySetInnerHTML={{ __html: htmlBody }} className="prose max-w-none" />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
