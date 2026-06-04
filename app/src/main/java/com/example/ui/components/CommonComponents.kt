package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import com.example.ui.theme.*
import kotlin.math.cos
import kotlin.math.sin

// Brush definition for our Gold Luxury Gradient
@Composable
fun goldGradientBrush() = Brush.linearGradient(
    colors = listOf(
        GoldPrimary,
        GoldHighlight,
        GoldPrimary,
        GoldBronze
    ),
    start = Offset.Zero,
    end = Offset.Infinite
)

// Ambient smoke animation for backgrounds
@Composable
fun SmokeAnimatedCanvas(modifier: Modifier = Modifier, smokeColor: Color = Color.White.copy(alpha = 0.04f)) {
    val infiniteTransition = rememberInfiniteTransition(label = "smoke")
    
    // Animate phase offsets for continuous fluid smoke motion
    val animationPhase1 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = Math.PI.toFloat() * 2f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "phase1"
    )

    val animationPhase2 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = Math.PI.toFloat() * 2f,
        animationSpec = infiniteRepeatable(
            animation = tween(18000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "phase2"
    )

    Canvas(modifier = modifier.fillMaxSize().blur(12.dp)) {
        val width = size.width
        val height = size.height

        // Define multiple "vape plume" particles
        val numClouds = 6
        for (i in 0 until numClouds) {
            val progress = (animationPhase1 + (i * Math.PI / numClouds)) % (Math.PI * 2)
            
            // X & Y drifting offsets based on sinusoidal paths
            val driftX = sin(progress).toFloat() * (width * 0.15f) + (width * (0.2f + 0.12f * i))
            val driftY = cos(progress + (i * 0.5f)).toFloat() * (height * 0.1f) + (height * (0.15f + 0.12f * i))
            
            // Pulsating radius
            val baseRadius = width * (0.2f + 0.05f * i)
            val scaleRadius = baseRadius * (1f + 0.15f * sin(progress * 2).toFloat())

            drawCircle(
                color = if (i % 2 == 0) NeonCyan.copy(alpha = 0.02f) else NeonStrawberry.copy(alpha = 0.015f),
                radius = scaleRadius,
                center = Offset(driftX, driftY)
            )

            // Overlap standard subtle grey/white smoke
            drawCircle(
                color = smokeColor,
                radius = scaleRadius * 0.8f,
                center = Offset(driftX - 20f, driftY + 30f)
            )
        }
    }
}

// Custom Premium Gold Gradient Button
@Composable
fun LuxuryGradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    testTag: String = ""
) {
    Box(
        modifier = modifier
            .testTag(testTag)
            .height(54.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(
                if (enabled) {
                    goldGradientBrush()
                } else {
                    Brush.linearGradient(listOf(Color(0xFF222222), Color(0xFF111111)))
                }
            )
            .clickable(enabled = enabled, onClick = onClick)
            .border(
                width = 1.dp,
                color = if (enabled) GoldHighlight.copy(alpha = 0.5f) else Color.Transparent,
                shape = RoundedCornerShape(16.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (enabled) PureBlack else TextGrayMuted,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
    }
}

// Glowing Border Card with optional custom Active Glow color (e.g. flavor neon)
@Composable
fun LuxuryGlowingBorderCard(
    modifier: Modifier = Modifier,
    glowColor: Color = GoldPrimary,
    strokeWidth: Dp = 1.5.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "glow_pulse")
    val alphaGlow by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(DarkGreyCard)
            .drawBehind {
                drawRoundRect(
                    color = glowColor.copy(alpha = alphaGlow * 0.12f),
                    size = size,
                    cornerRadius = CornerRadius(20.dp.toPx(), 20.dp.toPx()),
                    style = Stroke(width = strokeWidth.toPx() * 3.5f)
                )
                drawRoundRect(
                    color = glowColor.copy(alpha = alphaGlow),
                    size = size,
                    cornerRadius = CornerRadius(20.dp.toPx(), 20.dp.toPx()),
                    style = Stroke(width = strokeWidth.toPx())
                )
            }
            .padding(16.dp),
        content = content
    )
}

// Dynamic RGB LED strip that shifts and flows beautifully at the bottom of products
@Composable
fun RGBLEDStrip(modifier: Modifier = Modifier, height: Dp = 6.dp) {
    val infiniteTransition = rememberInfiniteTransition(label = "rgb_strobe")
    val shiftPhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shift"
    )

    Canvas(modifier = modifier.height(height).fillMaxWidth()) {
        val color1 = Color.hsv((shiftPhase + 0) % 360f, 0.9f, 1f)
        val color2 = Color.hsv((shiftPhase + 72) % 360f, 0.9f, 1f)
        val color3 = Color.hsv((shiftPhase + 144) % 360f, 0.9f, 1f)
        val color4 = Color.hsv((shiftPhase + 216) % 360f, 0.9f, 1f)
        val color5 = Color.hsv((shiftPhase + 288) % 360f, 0.9f, 1f)

        drawRect(
            brush = Brush.linearGradient(
                colors = listOf(color1, color2, color3, color4, color5),
                start = Offset.Zero,
                end = Offset(size.width, 0f)
            )
        )
    }
}

// Secondary Custom Outlined Glow Button
@Composable
fun LuxuryOutlinedButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    outlineColor: Color = GoldPrimary,
    testTag: String = ""
) {
    Box(
        modifier = modifier
            .testTag(testTag)
            .height(50.dp)
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .border(
                width = 1.5.dp,
                brush = Brush.linearGradient(listOf(outlineColor, outlineColor.copy(alpha = 0.3f))),
                shape = RoundedCornerShape(16.dp)
            )
            .background(Color.Transparent),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = Color.White,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
    }
}
