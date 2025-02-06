export const Hero = () => {
  console.log("Hero component rendering");
  return (
    <section className="relative w-full pt-32 pb-20 px-4 bg-white overflow-hidden">
      <div className="container mx-auto text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold text-[#7E69AB] mb-6 animate-fade-up">
          Expert Endocrinology Care for Your Health
        </h1>
        <p className="text-xl text-[#6E59A5] mb-8 max-w-2xl mx-auto animate-fade-up">
          Specialized care for hormonal health, diabetes management, and thyroid disorders with our experienced endocrinologists.
        </p>
      </div>
    </section>
  );
};