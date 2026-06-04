package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DeepCloudColorScheme = darkColorScheme(
    primary = GoldPrimary,
    secondary = GoldHighlight,
    tertiary = NeonCyan,
    background = PureBlack,
    surface = DarkGreySurface,
    onPrimary = PureBlack,
    onSecondary = PureBlack,
    onBackground = TextWhite,
    onSurface = TextWhite,
    surfaceVariant = DarkGreyCard,
    onSurfaceVariant = TextGraySecondary,
    outline = ActiveBorderGlow
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true, // Strictly Premium High-End Dark Mode only
    dynamicColor: Boolean = false, // No dynamic color override to maintain brand identity
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = DeepCloudColorScheme,
        typography = Typography,
        content = content
    )
}
