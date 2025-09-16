export default function Cancel() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Checkout canceled</h1>
      <p className="mt-2 text-muted-foreground">No charge was made. You can adjust your selections and try again.</p>
      <a href="/checkout" className="underline mt-6 inline-block">
        Return to checkout
      </a>
    </main>
  )
}
