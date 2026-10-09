<script lang="ts">
  import { router } from "./lib/router.svelte";
  import Projektliste from "./views/Projektliste.svelte";
  import NeuesProjekt from "./views/NeuesProjekt.svelte";
  import Editor from "./views/Editor.svelte";
</script>

{#if router.ansicht.name === "neu"}
  <NeuesProjekt />
{:else if router.ansicht.name === "projekt"}
  {#key router.ansicht.id}
    <Editor id={router.ansicht.id} />
  {/key}
{:else}
  <Projektliste />
{/if}
