"use client";

// This file uses VERY NEW browser APIs to test if ESLint catches them

export function FancyFeatures() {
  // 1. View Transitions API (Chrome 111+, NO Firefox/Safari)
  const startTransition = () => {
    document.startViewTransition(() => {
      console.log("transitioning");
    });
  };

  // 2. Scheduler API (Chrome 94+, NO Firefox/Safari)
  const scheduleTask = () => {
    scheduler.postTask(() => {
      console.log("scheduled");
    });
  };

  // 3. Navigation API (Chrome 102+, NO Firefox/Safari)
  const navigateSomewhere = () => {
    navigation.navigate("/somewhere");
  };

  // 4. File System Access API (Chrome 86+, NO Firefox/Safari)
  const pickFile = async () => {
    const handle = await window.showOpenFilePicker();
    return handle;
  };

  // 5. EyeDropper API (Chrome 95+, NO Firefox/Safari)
  const pickColor = async () => {
    const eyeDropper = new EyeDropper();
    const result = await eyeDropper.open();
    return result.sRGBHex;
  };

  // 6. structuredClone (relatively new - Chrome 98+, Firefox 94+, Safari 15.4+)
  const cloneData = (data: unknown) => {
    return structuredClone(data);
  };

  return (
    <div>
      <button onClick={startTransition}>View Transition</button>
      <button onClick={scheduleTask}>Schedule Task</button>
      <button onClick={navigateSomewhere}>Navigate</button>
      <button onClick={pickFile}>Pick File</button>
      <button onClick={pickColor}>Pick Color</button>
      <button onClick={() => cloneData({ test: 1 })}>Clone</button>
    </div>
  );
}
