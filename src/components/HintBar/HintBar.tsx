import styles from './HintBar.module.css'

const SEPARATOR = '·'

export function HintBar() {
  return (
    <div className={styles.hintBar} aria-label="Instructions">
      <span className={styles.sparkle} aria-hidden="true">✦</span>
      <span><span className={styles.kbd}>Double-click</span> to create</span>
      <span className={styles.sep} aria-hidden="true">{SEPARATOR}</span>
      <span><span className={styles.kbd}>Click</span> to edit</span>
      <span className={styles.sep} aria-hidden="true">{SEPARATOR}</span>
      <span><span className={styles.kbd}>Drag</span> to move</span>
      <span className={styles.sep} aria-hidden="true">{SEPARATOR}</span>
      <span><span className={styles.kbd}>Drop on trash</span> to delete</span>
    </div>
  )
}
