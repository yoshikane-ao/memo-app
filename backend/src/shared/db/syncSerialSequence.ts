type RawExecutor = {
  $executeRawUnsafe(query: string): Promise<unknown>;
};

export async function syncSerialSequence(executor: RawExecutor, tableName: "Memos" | "Tags") {
  const quotedTableName = `"${tableName}"`;

  await executor.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('${quotedTableName}', 'id'),
      COALESCE((SELECT MAX(id) FROM ${quotedTableName}), 1),
      COALESCE((SELECT COUNT(*) > 0 FROM ${quotedTableName}), false)
    )
  `);
}
