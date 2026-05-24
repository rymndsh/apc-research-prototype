<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>User List - SecureCode Guard</title>
</head>
<body>
    <h1>Daftar Pengguna - SecureCode Guard</h1>

    <form method="get" action="/users">
        <input type="text" name="search" placeholder="Cari username..." value="<?= esc($search_term) ?>">
        <button type="submit">Cari</button>
    </form>

    <br>

    <?php if (!empty($search_term)): ?>
        <!-- ❌ VULNERABLE -->
        <p>Hasil pencarian untuk: <?= $search_term ?></p>
    <?php endif; ?>

    <table border="1" cellpadding="8" cellspacing="0">
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Bio</th>
            <th>Aksi</th>
        </tr>
        <?php foreach ($users as $user): ?>
            <tr>
                <td><?= esc($user['id']) ?></td>
                <td><?= esc($user['username']) ?></td>
                <td><?= esc($user['email']) ?></td>
                
                <!-- ❌ VULNERABLE -->
                <td><?= $user['bio'] ?></td>
                
                <td>
                    <a href="/users/delete/<?= esc($user['id']) ?>" onclick="return confirm('Hapus user ini?')">Hapus</a>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>
