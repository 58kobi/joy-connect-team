import { ArrowRight } from "lucide-react";
import { CATEGORY_DATA } from "./requests";

export function Categories({
  onRequest,
}: {
  onRequest: (category: string) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-12 lg:py-24">
      <p className="text-xs tracking-[0.22em] text-muted-foreground sm:text-sm">
        HOW CAN WE HELP?
      </p>

      <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">
        Choose a support category
      </h2>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {CATEGORY_DATA.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => onRequest(item.title)}
              className="group flex min-h-[205px] flex-col rounded-lg border border-border bg-card p-5 text-left transition-[background-color,border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-foreground/20 hover:bg-surface hover:shadow-md"
            >
              <Icon size={28} strokeWidth={1.4} />
              <h3 className="mt-6 text-sm font-medium">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {item.text}
              </p>
              <ArrowRight
                size={16}
                strokeWidth={1.6}
                aria-hidden="true"
                className="mt-auto pt-4 transition-transform group-hover:translate-x-1"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
