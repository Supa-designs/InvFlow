import { useEffect, useCallback, useRef } from "react";

interface UseScannerProps {
  onScan: (code: string) => void;
  debounceTime?: number;
  minLength?: number;
}

export function useScanner({
  onScan,
  debounceTime = 50,
  minLength = 4,
}: UseScannerProps) {
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignoramos si el usuario esta escribiendo en algun input (a menos que no queramos escanear globalmente)
      // Pero usualmente los escaneres globales interceptan en el body.
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentTime = new Date().getTime();

      // Si paso mucho tiempo desde la última tecla, reiniciamos el buffer
      // (Los escaneres escriben MUY rápido, usualmente menos de 30ms por letra)
      if (currentTime - lastKeyTime.current > debounceTime) {
        barcodeBuffer.current = "";
      }

      // Si presiona Enter, evaluamos el buffer
      if (e.key === "Enter") {
        if (barcodeBuffer.current.length >= minLength) {
          onScan(barcodeBuffer.current);
          e.preventDefault();
        }
        barcodeBuffer.current = "";
      } else if (e.key.length === 1) { // Solo caracteres imprimibles
        barcodeBuffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    },
    [onScan, debounceTime, minLength]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
