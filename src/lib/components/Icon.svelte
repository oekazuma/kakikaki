<script lang="ts">
  // 24×24 の線画アイコン。色は currentColor
  const PATHS = {
    back: 'M19 12H5M11 6l-6 6 6 6',
    speaker: 'M4 9h4l5-4v14l-5-4H4zM16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12',
    redo: 'M4 11a8 8 0 1 1 2.3 5.7M4 4v7h7',
    undo: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
    check: 'M4 12.5l5 5L20 6',
    close: 'M6 6l12 12M18 6L6 18',
    trophy: 'M8 4h8v6a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 14v4M8 20h8',
    trace: 'M6 18a1.5 1.5 0 1 0 .01 0M18 6a1.5 1.5 0 1 0 .01 0M7.5 16.5C13 15 11 9 16.5 7.5',
    pencil: 'M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 19h14',
    book: 'M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z',
    bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.5h6c0-1.2.4-1.9 1-2.5A6 6 0 0 0 12 3z',
    eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v3',
    plus: 'M12 5v14M5 12h14',
    heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    upload: 'M12 16V4M6 10l6-6 6 6M4 20h16',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01'
  } as const;
  let { name, size = 24, fill = false }: { name: keyof typeof PATHS; size?: number; fill?: boolean } = $props();
</script>

<svg
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill={fill ? 'currentColor' : 'none'}
  stroke="currentColor"
  stroke-width={fill ? 1.5 : 2}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d={PATHS[name]} />
</svg>

<style>
  svg {
    display: inline-block;
    vertical-align: middle;
    flex: none;
  }
</style>
