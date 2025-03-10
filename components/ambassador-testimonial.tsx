import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Testimonials() {
  const testimonials = [
    {
      quote:
        "Being a Community Ambassador has allowed me to make a real difference in seniors' lives while earning extra income.",
      author: "Sarah Johnson",
      role: "Community Ambassador",
      avatar: "/placeholder.svg",
    },
    {
      quote:
        "The training and support provided by the program has been exceptional. I feel confident helping seniors with their Medicare decisions.",
      author: "Michael Chen",
      role: "Community Ambassador",
      avatar: "/placeholder.svg",
    },
  ];

  return (
    <section className="bg-accent/75 py-24">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="mb-16 text-center text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          What Our Ambassadors Say
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border border-primary/20 bg-gradient-to-br from-accent/10 to-accent/100"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={testimonial.avatar}
                      alt={testimonial.author}
                    />
                    <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-lg italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>{" "}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
