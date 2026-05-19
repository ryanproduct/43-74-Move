import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { cn } from "@/lib/utils";

type Props = {
  children: string;
  className?: string;
};

/**
 * Safe Markdown renderer. Uses remark-gfm for GitHub-flavoured tables /
 * task-lists / strikethrough, and rehype-sanitize to neutralise raw HTML.
 * Links open in a new tab with `rel="noopener noreferrer"`.
 *
 * Styling is hand-rolled with Tailwind utility classes (no prose plugin
 * dependency) so the output looks consistent across the app.
 */
export function Markdown({ children, className }: Props) {
  if (!children?.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        "markdown-body text-sm leading-relaxed text-foreground",
        // Headings
        "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold",
        "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold",
        // Paragraphs and lists
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-0.5",
        // Inline code & code blocks
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        // Blockquote
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
        // Links
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:no-underline",
        // Tables
        "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
        "[&_th]:border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left",
        "[&_td]:border [&_td]:px-2 [&_td]:py-1",
        // Horizontal rule
        "[&_hr]:my-4 [&_hr]:border-border",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
