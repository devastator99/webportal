
import { useResponsive } from '@/contexts/ResponsiveContext';
import { ResponsiveText, ResponsiveHeading } from '@/components/ui/responsive-typography';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { useResponsiveValue } from '@/hooks/use-responsive';

export const Hero = () => {
  const { isMobile, isTablet } = useResponsive();
  
  const paddingY = useResponsiveValue({
    mobile: 'min-h-screen flex items-center',
    tablet: 'min-h-screen flex items-center',
    desktop: 'min-h-screen flex items-center',
    default: 'min-h-screen flex items-center'
  });
  
  const headingSize = useResponsiveValue({
    mobile: '3xl',
    tablet: '4xl',
    desktop: '6xl',
    default: '4xl'
  });
  
  const marginBottom = useResponsiveValue({
    mobile: 'mb-4',
    tablet: 'mb-6',
    desktop: 'mb-8',
    default: 'mb-6'
  });
  
  return (
    <section className={`relative ${paddingY} overflow-hidden`}>
      <ResponsiveContainer>
        <div className="max-w-3xl mx-auto text-center">
          <ResponsiveHeading
            level="h1"
            mobileSize="3xl"
            tabletSize="4xl"
            desktopSize="6xl"
            className={`text-[#6E59A5] ${marginBottom} animate-fade-up`}
          >
            Expert Endocrinology Care for Your Health
          </ResponsiveHeading>
          
          <ResponsiveText
            mobileSize="base"
            tabletSize="lg"
            desktopSize="xl"
            className="text-[#7E69AB] mb-6 md:mb-8 animate-fade-up"
          >
            Specialized treatment for hormonal disorders, diabetes, and thyroid conditions with personalized care from experienced endocrinologists.
          </ResponsiveText>
          
          {!isMobile && (
            <div className={`mt-8 animate-fade-up ${isTablet ? 'px-6' : 'px-0'}`}>
              <div className="inline-block bg-[#E5DEFF]/50 backdrop-blur-sm px-4 py-2 rounded-full text-[#7E69AB]">
                Trusted by thousands of patients across India
              </div>
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </section>
  );
};
