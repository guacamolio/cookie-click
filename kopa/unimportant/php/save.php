<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(405);
	echo json_encode(['success' => false, 'error' => 'POST requests only']);
	exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
	http_response_code(400);
	echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
	exit;
}

$saveFile = __DIR__ . '/../data/save-data.json';
$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

if ($json === false || file_put_contents($saveFile, $json, LOCK_EX) === false) {
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => 'Could not save game']);
	exit;
}

echo json_encode(['success' => true]);
