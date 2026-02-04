<script setup lang="ts">
import { ref, watch } from "vue";
import type { PlanDialect } from "@/modules/planModel";
import { runExplain } from "@/services/planBridge";
import { parsePlanText } from "@/modules/planParser";
import { usePlanStore } from "@/stores/planStore";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const planStore = usePlanStore();

const dialect = ref<PlanDialect>("opengauss");
const host = ref("127.0.0.1");
const port = ref(5432);
const database = ref("postgres");
const user = ref("gauss");
const password = ref("");
const sql = ref("SELECT 1;");
const title = ref("Remote explain");
const sslMode = ref<"disable" | "require">("disable");
const statementTimeoutMs = ref(60000);
const allowInvalidCerts = ref(false);
const error = ref<string | null>(null);
const loading = ref(false);

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      error.value = null;
    }
  },
);

function close() {
  emit("close");
}

async function submit() {
  error.value = null;
  loading.value = true;
  try {
    const response = await runExplain({
      dialect: dialect.value,
      sql: sql.value,
      title: title.value,
      connection: {
        host: host.value,
        port: Number(port.value),
        database: database.value,
        user: user.value,
        password: password.value,
        sslMode: sslMode.value,
        allowInvalidCerts: allowInvalidCerts.value,
      },
      options: {
        statementTimeoutMs: statementTimeoutMs.value,
        perfMode: "normal",
      },
    });
    const plan = parsePlanText(response.planText, {
      dialectHint: response.dialect,
      title: response.title,
      source: "connection",
      capturedAt: response.capturedAt,
    });
    await planStore.ingestPlan(plan);
    close();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <teleport to="body">
    <div v-if="props.open" class="modal-backdrop" @click.self="close">
      <div class="modal glass-panel">
        <header>
          <h3>Run Remote EXPLAIN</h3>
          <button class="ghost" @click="close">Close</button>
        </header>
        <div class="grid">
          <label class="field">
            <span>Dialect</span>
            <select v-model="dialect">
              <option value="opengauss">openGauss</option>
              <option value="dws">Huawei DWS</option>
            </select>
          </label>
          <label class="field">
            <span>SSL Mode</span>
            <select v-model="sslMode">
              <option value="disable">Disable</option>
              <option value="require">Require</option>
            </select>
          </label>
        </div>
        <div class="grid">
          <label class="field">
            <span>Host</span>
            <input v-model="host" type="text" placeholder="db.example.com" />
          </label>
          <label class="field">
            <span>Port</span>
            <input v-model.number="port" type="number" min="1" max="65535" />
          </label>
          <label class="field">
            <span>Database</span>
            <input v-model="database" type="text" />
          </label>
        </div>
        <div class="grid">
          <label class="field">
            <span>User</span>
            <input v-model="user" type="text" />
          </label>
          <label class="field">
            <span>Password</span>
            <input v-model="password" type="password" />
          </label>
          <label class="field">
            <span>Statement Timeout (ms)</span>
            <input v-model.number="statementTimeoutMs" type="number" min="1000" step="1000" />
          </label>
        </div>
        <label class="checkbox">
          <input type="checkbox" v-model="allowInvalidCerts" /> Allow invalid certificates (lab use only)
        </label>
        <label class="field">
          <span>Title</span>
          <input v-model="title" type="text" placeholder="Describe this capture" />
        </label>
        <label class="field">
          <span>SQL</span>
          <textarea v-model="sql" rows="6"></textarea>
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="actions">
          <button class="ghost" @click="close">Cancel</button>
          <button class="glow" :disabled="loading" @click="submit">
            {{ loading ? "Running..." : "Execute" }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 9, 20, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal {
  width: min(840px, 95vw);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

input,
select,
textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem;
  color: var(--text-primary);
  font-family: inherit;
}

textarea {
  font-family: "JetBrains Mono", monospace;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.error {
  color: var(--critical);
  margin: 0;
}
</style>
