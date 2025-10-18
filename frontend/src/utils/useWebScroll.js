import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Hook para habilitar scroll do mouse no React Native Web - VERSÃO FINAL
 */
export const useWebScroll = (elementId) => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let element;
    let isScrolling = false;

    const findAndSetupScroll = () => {
      element = document.getElementById(elementId);
      if (!element) return;

      const handleWheel = (e) => {
        e.preventDefault();
        
        const delta = e.deltaY;
        const currentScroll = element.scrollTop;
        const maxScroll = element.scrollHeight - element.clientHeight;
        
        // Calcular novo scroll
        const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + delta));
        
        // Aplicar scroll
        element.scrollTop = newScroll;
      };

      // Configurar elemento
      element.style.overflowY = 'auto';
      element.style.maxHeight = 'calc(100vh - 160px)';
      element.style.height = 'calc(100vh - 160px)';
      
      // Adicionar listener
      element.addEventListener('wheel', handleWheel, { passive: false });
      
      console.log(`Scroll configurado para ${elementId}: maxHeight = ${element.style.maxHeight}`);

      return () => {
        if (element) {
          element.removeEventListener('wheel', handleWheel);
        }
      };
    };

    // Tentar configurar múltiplas vezes se necessário
    const attempts = [100, 500, 1000];
    const cleanupFunctions = [];
    
    attempts.forEach(delay => {
      const timer = setTimeout(() => {
        const cleanup = findAndSetupScroll();
        if (cleanup) cleanupFunctions.push(cleanup);
      }, delay);
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
  }, [elementId]);
};

export default useWebScroll;
