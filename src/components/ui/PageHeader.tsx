type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-2">
      <h1 className="text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
        {title}
      </h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </div>
  );
}
