import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface OnboardingStatus {
  hasUploadedMaterials: boolean;
  materialsCount: number;
  isLoading: boolean;
  error: string | null;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { data: session, status } = useSession();
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>({
    hasUploadedMaterials: false,
    materialsCount: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          const response = await fetch(`http://localhost:8002/user-status/${encodeURIComponent(session.user.email)}`);
          
          if (response.ok) {
            const data = await response.json();
            setOnboardingStatus({
              hasUploadedMaterials: data.has_uploaded_materials,
              materialsCount: data.materials_count,
              isLoading: false,
              error: null,
            });
          } else {
            setOnboardingStatus({
              hasUploadedMaterials: false,
              materialsCount: 0,
              isLoading: false,
              error: 'Failed to check onboarding status',
            });
          }
        } catch (error) {
          setOnboardingStatus({
            hasUploadedMaterials: false,
            materialsCount: 0,
            isLoading: false,
            error: 'Network error',
          });
        }
      } else if (status === 'unauthenticated') {
        setOnboardingStatus({
          hasUploadedMaterials: false,
          materialsCount: 0,
          isLoading: false,
          error: null,
        });
      }
    };

    checkOnboardingStatus();
  }, [session, status]);

  return onboardingStatus;
} 
