
import { useResponsive } from '@/contexts/ResponsiveContext';
import { ResponsiveText, ResponsiveHeading } from '@/components/ui/responsive-typography';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';

export const Hero = () => {
  const { isMobile, isTablet } = useResponsive();
  
  return (
    <section className="relative py-10 md:py-16 lg:py-24 overflow-hidden">
      <ResponsiveContainer>
        <div className="max-w-3xl mx-auto text-center">
          <ResponsiveHeading
            level="h1"
            mobileSize="3xl"
            tabletSize="4xl"
            desktopSize="6xl"
            className="text-[#6E59A5] mb-4 md:mb-6"
          >
            Expert Endocrinology Care for Your Health
          </ResponsiveHeading>
          
          <ResponsiveText
            mobileSize="base"
            tabletSize="lg"
            desktopSize="xl"
            className="text-[#7E69AB] mb-6 md:mb-8"
          >
            Specialized treatment for hormonal disorders, diabetes, and thyroid conditions with personalized care from experienced endocrinologists.
          </ResponsiveText>
          
          {!isMobile && (
            <div className={`mt-8 ${isTablet ? 'px-6' : 'px-0'}`}>
              <div className="inline-block bg-[#E5DEFF] px-4 py-2 rounded-full text-[#7E69AB]">
                Trusted by thousands of patients across India
              </div>
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </section>
  );
};
